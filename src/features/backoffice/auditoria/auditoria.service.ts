import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';

const BASE = `${SERVER_ROUTE}/api`;

export interface AuditoriaFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  usuario_id?: number;
  estado?: string;
  sucursal_id?: number;
}

export interface AuditoriaRow {
  orden_id: number;
  numero_orden: number;
  mesa: string;
  camarero: string;
  estado: string;
  subtotal: number;
  impuestos_total: number;
  total: number;
  fecha_apertura: string;
  fecha_cierre: string | null;
  notas: string | null;
  numero_factura: string | null;
  factura_anulada: boolean | null;
  pagos: Array<{ forma_pago: string; monto: number; referencia: string | null }>;
}

export interface AuditoriaLinea {
  id: number;
  articulo_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  estado: string | null;
  enviado_a_cocina: boolean;
  cuenta_num: number;
  notas_linea: string | null;
  agregado_en: string;
  modificadores: { nombre: string; precio_extra: number }[];
  kds: { destino: string; estado: string; tiempo_recibido: string | null; tiempo_preparado: string | null }[];
}

export interface AuditoriaPago {
  id: number;
  forma_pago: string;
  monto: number;
  referencia: string | null;
  turno_id: number | null;
  turno_apertura: string | null;
  turno_cierre: string | null;
  turno_monto_apertura: number | null;
  cajero: string | null;
}

export interface AuditoriaDetalle {
  orden: AuditoriaRow & {
    factura_id: number | null;
    factura_fecha: string | null;
    tipo_servicio: string;
  };
  lineas: AuditoriaLinea[];
  pagos:  AuditoriaPago[];
}

export const getAuditoria = (filtros: AuditoriaFiltros): Promise<AuditoriaRow[]> => {
  const params = new URLSearchParams();
  if (filtros.fecha_inicio) params.set('fecha_inicio', filtros.fecha_inicio);
  if (filtros.fecha_fin)    params.set('fecha_fin', filtros.fecha_fin);
  if (filtros.usuario_id)   params.set('usuario_id', String(filtros.usuario_id));
  if (filtros.estado)       params.set('estado', filtros.estado);
  if (filtros.sucursal_id)  params.set('sucursal_id', String(filtros.sucursal_id));
  return http.get<AuditoriaRow[]>(`${BASE}/reportes/auditoria?${params}`);
};

export const getAuditoriaDetalle = (ordenId: number): Promise<AuditoriaDetalle> =>
  http.get<AuditoriaDetalle>(`${BASE}/reportes/auditoria/${ordenId}`);
