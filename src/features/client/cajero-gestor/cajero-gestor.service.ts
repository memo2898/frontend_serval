import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';

const BASE = `${SERVER_ROUTE}/api`;

interface Paginado<T> { data: T[]; meta: unknown }
const unwrap = <T>(r: Paginado<T> | T[]): T[] => Array.isArray(r) ? r : (r?.data ?? []);

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface UsuarioCamarero {
  id:       number;
  nombre:   string;
  apellido: string;
  roles:    Array<{ id: number; nombre: string }>;
}

export interface OrdenResumen {
  id:            number;
  numero_orden:  number;
  mesa_id:       number | null;
  mesa_label:    string;
  usuario_id:    number | null;
  estado:        string;
  subtotal:      number;
  total:         number;
  tipo_servicio: string;
  agregado_en:   string;
  fecha_cierre?: string;
}

// ─── Servicios ───────────────────────────────────────────────────────────────

interface UsuarioRolEntry {
  usuario_id: number;
  rol_id:     number;
  usuario:    UsuarioCamarero & { sucursal_id: number };
  rol:        { id: number; nombre: string };
}

export const getUsuariosStaff = async (sucursalId: number): Promise<UsuarioCamarero[]> => {
  const entries = await http.get<UsuarioRolEntry[]>(`${BASE}/usuario-rol`);
  const seen = new Set<number>();
  const result: UsuarioCamarero[] = [];
  for (const entry of entries) {
    if (
      entry.rol.nombre.toLowerCase() === 'camarero' &&
      entry.usuario.sucursal_id === sucursalId &&
      !seen.has(entry.usuario_id)
    ) {
      seen.add(entry.usuario_id);
      result.push(entry.usuario);
    }
  }
  return result;
};

const _mapOrden = (o: Record<string, unknown>): OrdenResumen => ({
  id:            o.id as number,
  numero_orden:  o.numero_orden as number,
  mesa_id:       (o.mesa_id as number | null) ?? null,
  mesa_label:    (o.mesa as string) ?? (o.mesa_id ? `Mesa ${o.mesa_id}` : 'Mostrador'),
  usuario_id:    (o.usuario_id as number | null) ?? null,
  estado:        o.estado as string,
  subtotal:      Number(o.subtotal ?? 0),
  total:         Number(o.total ?? 0),
  tipo_servicio: o.tipo_servicio as string,
  agregado_en:   (o.agregado_en ?? o.fecha_apertura ?? '') as string,
  fecha_cierre:  o.fecha_cierre as string | undefined,
});

export const getOrdenesActivas = async (sucursalId: number): Promise<OrdenResumen[]> => {
  const estados = ['abierta', 'preparacion', 'por_cobrar'];
  const results = await Promise.all(
    estados.map(estado =>
      http.get<Paginado<Record<string, unknown>> | Record<string, unknown>[]>(
        `${BASE}/ordenes?sucursal_id=${sucursalId}&estado=${estado}&sort=agregado_en:DESC`,
      ).then(r => unwrap(r)).catch(() => [] as Record<string, unknown>[]),
    ),
  );
  return results.flat().map(_mapOrden);
};

export const getOrdenesCobradas = async (
  sucursalId: number,
  desde: string,
  hasta: string,
): Promise<OrdenResumen[]> => {
  const raw = await http.get<Paginado<Record<string, unknown>> | Record<string, unknown>[]>(
    `${BASE}/ordenes?sucursal_id=${sucursalId}&estado=cobrada&fecha_cierre_desde=${desde}&fecha_cierre_hasta=${hasta}&sort=fecha_cierre:DESC`,
  );
  return unwrap(raw).map(_mapOrden);
};
