import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { TicketCola, PagoAplicado, LineaCobro, ImpuestoCaja } from './caja.types';
import { CAJA_QUEUE_KEY } from '../shared/services/pos-channel';

const BASE = `${SERVER_ROUTE}/api`;

// ─── Cola local (localStorage) ────────────────────────────────────────────────

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

// ─── API ─────────────────────────────────────────────────────────────────────

export const confirmarCobro = (ordenId: number, pagos: PagoAplicado[]) =>
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
  empresa?: { id: number; nombre: string; logo?: string };
}

export const getSucursalInfo = (id: number) =>
  http.get<SucursalInfo>(`${BASE}/sucursales/${id}`);

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
  modificadores?: Array<{ modificador_id: number; precio_extra: string | number; nombre_modificador?: string; modificador?: { nombre: string } }>;
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
      nombre_modificador: m.nombre_modificador ?? '',
      precio_extra:       Number(m.precio_extra),
    })),
  }));
};
