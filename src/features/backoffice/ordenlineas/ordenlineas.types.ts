import type { GridieCellAction } from '@/lib/gridie';

export interface OrdenLineas {
  id?: number;
  orden_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_unitario?: number;
  descuento_linea?: number;
  impuesto_linea?: number;
  subtotal_linea?: number;
  estado?: string;
  enviado_a_cocina?: boolean;
  fecha_envio?: string;
  cuenta_num?: number;
  notas_linea?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface OrdenLineasGridRow {
  id?: number;
  orden_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_unitario?: number;
  descuento_linea?: number;
  impuesto_linea?: number;
  subtotal_linea?: number;
  estado?: string;
  enviado_a_cocina?: boolean;
  fecha_envio?: string;
  cuenta_num?: number;
  notas_linea?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface OrdenLineasCreateDTO {
  orden_id: number;
  articulo_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento_linea: number;
  impuesto_linea: number;
  subtotal_linea: number;
  enviado_a_cocina: boolean;
  fecha_envio: string;
  cuenta_num: number;
  notas_linea: string;
}

export interface OrdenLineasUpdateDTO {
  orden_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_unitario?: number;
  descuento_linea?: number;
  impuesto_linea?: number;
  subtotal_linea?: number;
  enviado_a_cocina?: boolean;
  fecha_envio?: string;
  cuenta_num?: number;
  notas_linea?: string;
}

export interface OrdenLineasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  orden_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_unitario?: number;
  descuento_linea?: number;
  impuesto_linea?: number;
  subtotal_linea?: number;
  estado?: string;
  enviado_a_cocina?: boolean;
  fecha_envio?: string;
  cuenta_num?: number;
  notas_linea?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
