import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { TicketCola, PagoAplicado, LineaCobro, ImpuestoCaja, OrdenDespachada, OrdenProxima } from './caja.types';
import { CAJA_QUEUE_KEY } from '../shared/services/pos-channel';

const BASE = `${SERVER_ROUTE}/api`;

// ─── Nombres de cuenta (misma clave que mesas para compartir entre pestañas) ──

const CUENTAS_NOMBRES_PREFIX = 'serval_cuentas_';

function loadCuentasNombres(ordenId: number): Record<number, string> {
  try {
    const raw = localStorage.getItem(CUENTAS_NOMBRES_PREFIX + ordenId);
    return raw ? (JSON.parse(raw) as Record<number, string>) : {};
  } catch { return {}; }
}

export function saveCuentasNombres(ordenId: number, nombres: Record<number, string>): void {
  try {
    if (Object.keys(nombres).length === 0) {
      localStorage.removeItem(CUENTAS_NOMBRES_PREFIX + ordenId);
    } else {
      localStorage.setItem(CUENTAS_NOMBRES_PREFIX + ordenId, JSON.stringify(nombres));
    }
  } catch { /* ignorar */ }
}

// ─── Cola local (localStorage) — solo cache de sesión ────────────────────────

export function getQueue(): TicketCola[] {
  try {
    return JSON.parse(localStorage.getItem(CAJA_QUEUE_KEY) ?? '[]') as TicketCola[];
  } catch {
    return [];
  }
}

export function removeFromQueue(mesaId: number): void {
  const queue = getQueue().filter(t => t.mesaId !== mesaId);
  localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
}

// ─── Cola desde BD — fuente de verdad ────────────────────────────────────────

interface RawOrden {
  id: number;
  mesa_id: number | null;
  numero_orden: number | null;
  estado: string;
  subtotal: string | number | null;
  impuestos_total: string | number | null;
  total: string | number | null;
  notas?: string;
  agregado_en?: string;
  mesa?: { id: number; nombre: string; personas?: number | null };
}

export const fetchOrdenesEnCola = async (sucursalId: number): Promise<TicketCola[]> => {
  interface Paginado<T> { data: T[] }
  const raw = await http.get<Paginado<RawOrden> | RawOrden[]>(
    `${BASE}/ordenes?estado=por_cobrar&sucursal_id=${sucursalId}`,
  );
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  const filtered = list.filter(o => o.id != null && o.mesa_id != null);

  // Pre-cargar líneas de cada orden: necesitamos el conteo real y subtotales frescos
  return Promise.all(filtered.map(async o => {
    const lineas = await fetchLineasOrden(o.id);
    const subtotal = Math.round(lineas.reduce((s, l) => s + l.subtotal_linea, 0) * 100) / 100;

    // Derivar split desde las líneas (cuenta_num persiste en BD)
    const maxCuenta = lineas.reduce((mx, l) => Math.max(mx, l.cuenta_num || 1), 1);
    const splitMode = maxCuenta > 1;

    return {
      id:            o.id,
      mesaId:        o.mesa_id!,
      mesaLabel:     o.mesa?.nombre ?? `Mesa ${o.mesa_id}`,
      numComensales: o.mesa?.personas ?? 1,
      orden: {
        id:              o.id,
        numero_orden:    o.numero_orden ?? o.id,
        mesa_id:         o.mesa_id!,
        estado:          o.estado,
        subtotal,
        impuestos_total: Number(o.impuestos_total ?? 0),
        total:           Number(o.total ?? 0),
        notas:           o.notas,
      },
      lineas,
      splitMode,
      numCuentas:     splitMode ? maxCuenta : 1,
      cuentasNombres: loadCuentasNombres(o.id),
      timestamp:      o.agregado_en ? new Date(o.agregado_en).getTime() : Date.now(),
    };
  }));
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const updateLineaCuenta = (lineaId: number, cuentaNum: number): Promise<void> =>
  http.patch(`${BASE}/orden-lineas/${lineaId}`, { cuenta_num: cuentaNum }).then(() => {});

export const updateLineaCaja = (lineaId: number, data: Partial<{ cantidad: number; subtotal_linea: number; cuenta_num: number }>): Promise<void> =>
  http.patch(`${BASE}/orden-lineas/${lineaId}`, data).then(() => {});

export const crearLineaOrden = async (ordenId: number, data: {
  articulo_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  cuenta_num?: number;
  enviado_a_cocina?: boolean;
  estado?: string;
  modificadores?: Array<{ modificador_id: number; precio_extra: number }>;
}): Promise<void> => {
  const { modificadores, ...lineaData } = data;
  const linea = await http.post<{ id: number }>(`${BASE}/orden-lineas`, { ...lineaData, orden_id: ordenId });
  if (modificadores?.length) {
    await Promise.all(modificadores.map(m =>
      http.post(`${BASE}/orden-linea-modificadores`, {
        orden_linea_id: linea.id,
        modificador_id: m.modificador_id,
        precio_extra:   m.precio_extra,
      }).catch(() => {}),
    ));
  }
};

export const confirmarCobro = (
  ordenId: number,
  pagos: PagoAplicado[],
) =>
  http.post(`${BASE}/ordenes/${ordenId}/cobrar`, {
    pagos: pagos.map(({ forma_pago_id, monto, cuenta_num, referencia }) => ({
      forma_pago_id, monto, cuenta_num,
      ...(referencia ? { referencia } : {}),
    })),
  });

export const getFormasPago = () =>
  http.get<Array<{ id: number; nombre: string; tipo: string; icono?: string }>>(`${BASE}/formas-pago`);

/** Convierte el campo `tipo` de la BD al HTML de un icono Font Awesome. */
export function tipoToFaIcon(tipo: string): string {
  const t = (tipo ?? '').toLowerCase().trim();
  if (t.includes('efectivo') || t.includes('cash'))           return '<i class="fa-solid fa-money-bill-wave"></i>';
  if (t.includes('tarjeta') || t.includes('card'))            return '<i class="fa-solid fa-credit-card"></i>';
  if (t.includes('debito') || t.includes('débito'))           return '<i class="fa-solid fa-credit-card"></i>';
  if (t.includes('credito') || t.includes('crédito'))         return '<i class="fa-solid fa-credit-card"></i>';
  if (t.includes('transfer') || t.includes('banco'))          return '<i class="fa-solid fa-building-columns"></i>';
  if (t.includes('cheque') || t.includes('check'))            return '<i class="fa-solid fa-money-check"></i>';
  if (t.includes('qr') || t.includes('pago movil') || t.includes('movil')) return '<i class="fa-solid fa-qrcode"></i>';
  if (t.includes('gift') || t.includes('regalo') || t.includes('voucher')) return '<i class="fa-solid fa-gift-card"></i>';
  if (t.includes('crypto') || t.includes('bitcoin'))          return '<i class="fa-brands fa-bitcoin"></i>';
  if (t.includes('paypal'))                                   return '<i class="fa-brands fa-paypal"></i>';
  return '<i class="fa-solid fa-wallet"></i>';
}

interface SucursalInfo {
  id: number;
  nombre: string;
  direccion?: string | null;
  empresa?: { id: number; nombre: string; logo?: string; numero_documento?: string | null };
}

export const getSucursalInfo = (id: number) =>
  http.get<SucursalInfo>(`${BASE}/sucursales/${id}`);

// ─── Órdenes cobradas (historial) ────────────────────────────────────────────

interface RawOrdenCobrada {
  id: number;
  mesa_id: number | null;
  numero_orden: number | null;
  estado: string;
  subtotal: string | number | null;
  impuestos_total: string | number | null;
  total: string | number | null;
  fecha_apertura?: string;
  fecha_cierre?: string;
  agregado_en?: string;
  mesa?: { id: number; nombre: string };
}

export const fetchOrdenesCobradas = async (
  sucursalId: number,
  desde: string,
  hasta: string,
): Promise<OrdenDespachada[]> => {
  interface Paginado<T> { data: T[] }
  const params = new URLSearchParams({
    estado: 'cobrada',
    sucursal_id: String(sucursalId),
    fecha_cierre_desde: desde,
    fecha_cierre_hasta: hasta,
    sort: 'fecha_cierre:DESC',
  });
  const raw = await http.get<Paginado<RawOrdenCobrada> | RawOrdenCobrada[]>(
    `${BASE}/ordenes?${params}`,
  );
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  return list
    .filter(o => o.id != null)
    .map(o => ({
      id:           o.id,
      mesaLabel:    o.mesa?.nombre ?? `Mesa ${o.mesa_id ?? '?'}`,
      numeroOrden:  o.numero_orden ?? o.id,
      subtotal:     Number(o.subtotal ?? 0),
      total:        Number(o.total ?? 0),
      fechaCierre:  o.fecha_cierre ?? o.agregado_en ?? '',
    }));
};

// ─── Órdenes próximas (activas, aún no en cola de cobro) ─────────────────────

export const fetchOrdenesProximas = async (sucursalId: number): Promise<OrdenProxima[]> => {
  interface Paginado<T> { data: T[] }
  const raw = await http.get<Paginado<RawOrden> | RawOrden[]>(
    `${BASE}/ordenes?estado=abierta&sucursal_id=${sucursalId}`,
  );
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  return list
    .filter(o => o.id != null)
    .map(o => ({
      id:          o.id,
      mesaLabel:   o.mesa?.nombre ?? `Mesa ${o.mesa_id ?? '?'}`,
      numeroOrden: o.numero_orden ?? o.id,
      subtotal:    Number(o.subtotal ?? 0),
      total:       Number(o.total ?? 0),
      agregadoEn:  o.agregado_en ?? '',
    }));
};

// ─── Impuestos ────────────────────────────────────────────────────────────────

interface RawSucursalImpuesto {
  impuesto_id: number;
  impuesto?: { id: number; nombre: string; porcentaje: string | number };
}

export const getImpuestosCaja = async (sucursalId: number): Promise<ImpuestoCaja[]> => {
  interface Paginado<T> { data: T[] }
  const raw = await http.get<Paginado<RawSucursalImpuesto> | RawSucursalImpuesto[]>(
    `${BASE}/sucursal-impuestos?sucursal_id=${sucursalId}`,
  );
  const items = Array.isArray(raw) ? raw : (raw?.data ?? []);
  if (!items.length) return [];

  if (!items[0].impuesto) {
    const impRaw = await http.get<Paginado<{ id: number; nombre: string; porcentaje: string | number }> | Array<{ id: number; nombre: string; porcentaje: string | number }>>(
      `${BASE}/impuestos`,
    );
    const impList = Array.isArray(impRaw) ? impRaw : (impRaw?.data ?? []);
    const impMap = new Map(impList.map(i => [i.id, i]));
    return items
      .map(item => impMap.get(item.impuesto_id))
      .filter(Boolean)
      .map(i => ({ nombre: i!.nombre, porcentaje: Number(i!.porcentaje) }));
  }

  return items
    .filter(item => item.impuesto != null)
    .map(item => ({ nombre: item.impuesto!.nombre, porcentaje: Number(item.impuesto!.porcentaje) }));
};

type RawLinea = LineaCobro & {
  articulo?: { nombre: string };
  modificadores?: Array<{ id?: number; modificador_id: number; precio_extra: string | number; nombre_modificador?: string; modificador?: { nombre: string } }>;
};

export const fetchLineasOrden = async (ordenId: number): Promise<LineaCobro[]> => {
  interface Paginado<T> { data: T[] }
  const raw = await http.get<Paginado<RawLinea> | RawLinea[]>(`${BASE}/ordenes/${ordenId}/lineas`);
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  return list.map(l => ({
    id:              l.id,
    orden_id:        l.orden_id,
    articulo_id:     l.articulo_id,
    nombre_articulo: l.nombre_articulo ?? l.articulo?.nombre ?? '',
    cantidad:        Number(l.cantidad),
    precio_unitario: Number(l.precio_unitario),
    subtotal_linea:  Number(l.subtotal_linea),
    estado:          l.estado ?? 'pendiente',
    cuenta_num:      l.cuenta_num ?? 1,
    modificadores:   (l.modificadores ?? []).map(m => ({
      id:                 m.id ?? 0,
      modificador_id:     m.modificador_id,
      nombre_modificador: m.nombre_modificador ?? (m as any).modificador?.nombre ?? '',
      precio_extra:       Number(m.precio_extra),
    })),
  }));
};
