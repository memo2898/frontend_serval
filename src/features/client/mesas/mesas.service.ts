import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type {
  Zona, Mesa, Familia, Articulo,
  GrupoModificador, Orden, LineaOrden, ImpuestoSucursal,
} from './mesas.types';

const BASE = `${SERVER_ROUTE}/api`;

interface Paginado<T> { data: T[]; meta: unknown }

const unwrap = <T>(res: Paginado<T> | T[]): T[] =>
  Array.isArray(res) ? res : res.data;

// ─── Catálogo ────────────────────────────────────────────────────────────────

export const getImpuestosSucursal = async (sucursalId: number): Promise<ImpuestoSucursal[]> => {
  const raw = await http.get<Paginado<ImpuestoSucursal> | ImpuestoSucursal[]>(
    `${BASE}/sucursal-impuestos?sucursal_id=${sucursalId}`,
  );
  const items = Array.isArray(raw) ? raw : (raw?.data ?? []);
  if (!items.length) return [];

  if (!items[0].impuesto) {
    const impRaw = await http.get<Paginado<ImpuestoSucursal['impuesto']> | ImpuestoSucursal['impuesto'][]>(
      `${BASE}/impuestos`,
    );
    const impList = Array.isArray(impRaw) ? impRaw : (impRaw?.data ?? []);
    const impMap = new Map(impList.map(i => [i.id, i]));
    return items.map(item => ({ ...item, impuesto: impMap.get(item.impuesto_id)! }));
  }

  return items;
};

export const getZonas = (sucursalId: number) =>
  http.get<Paginado<Zona> | Zona[]>(`${BASE}/zonas?sucursal_id=${sucursalId}&estado=activo`)
    .then(unwrap<Zona>);

export const getMesasByZona = (zonaId: number) =>
  http.get<Paginado<Mesa> | Mesa[]>(`${BASE}/mesas?zona_id=${zonaId}`)
    .then(unwrap<Mesa>);

export const getFamilias = (sucursalId: number) =>
  http.get<Paginado<Familia> | Familia[]>(`${BASE}/familias?sucursal_id=${sucursalId}&estado=activo`)
    .then(unwrap<Familia>);

export const getArticulos = (familiaId: number) =>
  http.get<Paginado<Articulo> | Articulo[]>(`${BASE}/articulos?familia_id=${familiaId}&estado=activo`)
    .then(unwrap<Articulo>);

export const getAllArticulos = () =>
  http.get<Paginado<Articulo> | Articulo[]>(`${BASE}/articulos?estado=activo`)
    .then(unwrap<Articulo>);

interface RawModificador {
  id: number;
  grupo_modificador_id: number;
  nombre: string;
  precio_extra: string | number;
}

interface RawAGM {
  articulo_id: number;
  grupo_modificador_id: number;
  grupo_modificador: {
    id: number;
    nombre: string;
    tipo: 'articulo' | 'comentario';
    seleccion: 'unica' | 'multiple';
    obligatorio: boolean;
    min_seleccion: number;
    max_seleccion: number;
  };
}

export const getModificadores = async (articuloId: number): Promise<GrupoModificador[]> => {
  const agmsRaw = await http.get<RawAGM[] | Paginado<RawAGM>>(
    `${BASE}/articulo-grupos-modificadores?articulo_id=${articuloId}`,
  );
  const agms = Array.isArray(agmsRaw) ? agmsRaw : (agmsRaw?.data ?? []);
  if (!agms.length) return [];

  return Promise.all(
    agms.map(async agm => {
      const g: RawAGM['grupo_modificador'] = agm.grupo_modificador
        ?? await http.get<RawAGM['grupo_modificador']>(`${BASE}/grupos-modificadores/${agm.grupo_modificador_id}`);

      const modsRaw = await http.get<RawModificador[] | Paginado<RawModificador>>(
        `${BASE}/modificadores?grupo_modificador_id=${agm.grupo_modificador_id}`,
      );
      const mods = Array.isArray(modsRaw) ? modsRaw : (modsRaw?.data ?? []);

      return {
        id: g.id,
        nombre: g.nombre,
        tipo: g.tipo,
        seleccion: g.seleccion,
        obligatorio: g.obligatorio,
        min_seleccion: g.min_seleccion,
        max_seleccion: g.max_seleccion,
        opciones: mods.map(m => ({
          id: m.id,
          nombre: m.nombre,
          precio_extra: Number(m.precio_extra),
        })),
      } as GrupoModificador;
    }),
  );
};

// ─── Mesas ───────────────────────────────────────────────────────────────────

export const patchEstadoMesa = (mesaId: number, estado: string) =>
  http.patch(`${BASE}/mesas/${mesaId}`, { estado });

export const patchMesaPersonas = (mesaId: number, personas: number) =>
  http.patch(`${BASE}/mesas/${mesaId}`, { personas });

export const patchMesaData = (mesaId: number, data: Partial<{ estado: string; mesa_principal_id: number | null }>) =>
  http.patch(`${BASE}/mesas/${mesaId}`, data);

// ─── Órdenes ─────────────────────────────────────────────────────────────────

export const getOrden = (ordenId: number) =>
  http.get<Orden>(`${BASE}/ordenes/${ordenId}`);

/** Devuelve la orden activa de una mesa (cualquier estado no cobrado/cancelado). */
export const getOrdenActivaMesa = async (mesaId: number): Promise<Orden[]> => {
  const [abierta, enPrep, lista, porCobrar] = await Promise.all([
    http.get<Paginado<Orden> | Orden[]>(`${BASE}/ordenes?mesa_id=${mesaId}&estado=abierta`).then(unwrap<Orden>),
    http.get<Paginado<Orden> | Orden[]>(`${BASE}/ordenes?mesa_id=${mesaId}&estado=en_preparacion`).then(unwrap<Orden>),
    http.get<Paginado<Orden> | Orden[]>(`${BASE}/ordenes?mesa_id=${mesaId}&estado=lista`).then(unwrap<Orden>),
    http.get<Paginado<Orden> | Orden[]>(`${BASE}/ordenes?mesa_id=${mesaId}&estado=por_cobrar`).then(unwrap<Orden>),
  ]);
  return [...abierta, ...enPrep, ...lista, ...porCobrar];
};

/** Devuelve la última orden de la mesa sin filtrar por estado (cobrada, cancelada, etc.). */
export const getUltimaOrdenMesa = (mesaId: number): Promise<Orden | null> =>
  http.get<Paginado<Orden> | Orden[]>(`${BASE}/ordenes?mesa_id=${mesaId}&limit=1&order=desc`)
    .then(unwrap<Orden>)
    .then(arr => arr[0] ?? null)
    .catch(() => null);

export const createOrden = (data: {
  sucursal_id: number;
  mesa_id: number;
  usuario_id: number;
  terminal_id?: number;
  tipo_servicio?: string;
}) => http.post<Orden>(`${BASE}/ordenes`, data);

export const updateOrden = (id: number, data: Partial<Orden>) =>
  http.patch<Orden>(`${BASE}/ordenes/${id}`, data);

// ─── Líneas ───────────────────────────────────────────────────────────────────

// El backend puede devolver modificadores como OrdenLineaModificadore con relación eager
// { id, modificador_id, precio_extra, modificador: { id, nombre, ... } }
// o ya normalizados { id, modificador_id, nombre_modificador, precio_extra }
type RawModLinea = {
  id: number;
  modificador_id: number;
  precio_extra: string | number;
  nombre_modificador?: string;
  modificador?: { id: number; nombre: string };
};

const normalizeLinea = (l: LineaOrden & { modificadores?: RawModLinea[] }): LineaOrden => ({
  ...l,
  cantidad:        Number(l.cantidad),
  precio_unitario: Number(l.precio_unitario),
  subtotal_linea:  Number(l.subtotal_linea),
  nombre_articulo: l.nombre_articulo ?? l.articulo?.nombre ?? '',
  modificadores:   (l.modificadores ?? []).map(m => ({
    id:                m.id,
    modificador_id:    m.modificador_id,
    nombre_modificador: m.nombre_modificador ?? '',
    precio_extra:      Number(m.precio_extra),
  })),
});

// GET: la ruta anidada sí existe en el backend  (/ordenes/:id/lineas)
export const getLineas = (ordenId: number) =>
  http.get<Paginado<LineaOrden> | LineaOrden[]>(`${BASE}/ordenes/${ordenId}/lineas`)
    .then(unwrap<LineaOrden>)
    .then(lineas => lineas.map(normalizeLinea));

// POST/PATCH/DELETE: el controlador de líneas es plano (/orden-lineas)
export const createLinea = async (ordenId: number, data: {
  articulo_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  cuenta_num?: number;
  notas_linea?: string;
  modificadores?: Array<{ modificador_id: number; precio_extra: number }>;
}): Promise<LineaOrden> => {
  const { modificadores, ...lineaData } = data;

  const linea = await http.post<LineaOrden>(`${BASE}/orden-lineas`, {
    ...lineaData,
    orden_id: ordenId,
  });

  // Persistir modificadores por separado si los hay
  if (modificadores?.length) {
    await Promise.all(
      modificadores.map(m =>
        http.post(`${BASE}/orden-linea-modificadores`, {
          orden_linea_id: linea.id,
          modificador_id: m.modificador_id,
          precio_extra:   m.precio_extra,
        }).catch(() => {}),
      ),
    );
  }

  return normalizeLinea(linea);
};

export const updateLinea = (_ordenId: number, lineaId: number, data: Partial<LineaOrden>) =>
  http.patch<LineaOrden>(`${BASE}/orden-lineas/${lineaId}`, data);

export const deleteLinea = (_ordenId: number, lineaId: number) =>
  http.delete(`${BASE}/orden-lineas/${lineaId}`);

// ─── Acciones de orden ────────────────────────────────────────────────────────

/**
 * "Enviar a cocina" se hace completamente vía socket (orden:enviar_a_cocina).
 * Esta función solo marca la orden como en_preparacion en la BD.
 */
export const marcarOrdenEnPreparacion = (ordenId: number) =>
  http.patch(`${BASE}/ordenes/${ordenId}`, { estado: 'en_preparacion' }).catch(() => {});

/**
 * "Pedir cuenta": marca la orden como por_cobrar y la envía a caja vía socket.
 * El socket lo maneja el backend al recibir caja:orden_lista_cobrar.
 */
export const marcarOrdenPorCobrar = (ordenId: number) =>
  http.patch(`${BASE}/ordenes/${ordenId}`, { estado: 'por_cobrar' });
