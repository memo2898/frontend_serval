import type { GridieCellAction } from '@/lib/gridie';

export interface Ordenes {
  id?: number;
  sucursal_id?: number;
  terminal_id?: number;
  usuario_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  turno_id?: number;
  tipo_servicio?: string;
  estado?: string;
  numero_orden?: number;
  descuento_total?: number;
  subtotal?: number;
  impuestos_total?: number;
  total?: number;
  notas?: string;
  fecha_apertura?: string;
  fecha_cierre?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface OrdenesGridRow {
  id?: number;
  sucursal_id?: number;
  terminal_id?: number;
  usuario_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  turno_id?: number;
  tipo_servicio?: string;
  estado?: string;
  numero_orden?: number;
  descuento_total?: number;
  subtotal?: number;
  impuestos_total?: number;
  total?: number;
  notas?: string;
  fecha_apertura?: string;
  fecha_cierre?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface OrdenesCreateDTO {
  sucursal_id?: number;
  terminal_id?: number;
  usuario_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  turno_id?: number;
  tipo_servicio?: string;
  numero_orden?: number;
  descuento_total?: number;
  subtotal?: number;
  impuestos_total?: number;
  total?: number;
  notas?: string;
  fecha_apertura?: string;
  fecha_cierre?: string;
}

export interface OrdenesUpdateDTO {
  sucursal_id?: number;
  terminal_id?: number;
  usuario_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  turno_id?: number;
  tipo_servicio?: string;
  numero_orden?: number;
  descuento_total?: number;
  subtotal?: number;
  impuestos_total?: number;
  total?: number;
  notas?: string;
  fecha_apertura?: string;
  fecha_cierre?: string;
}

export interface OrdenesFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  terminal_id?: number;
  usuario_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  turno_id?: number;
  tipo_servicio?: string;
  estado?: string;
  numero_orden?: number;
  descuento_total?: number;
  subtotal?: number;
  impuestos_total?: number;
  total?: number;
  notas?: string;
  fecha_apertura?: string;
  fecha_cierre?: string;
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
