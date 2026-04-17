import type { GridieCellAction } from '@/lib/gridie';

export interface Reservaciones {
  id?: number;
  sucursal_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  nombre_contacto?: string;
  telefono?: string;
  fecha_hora?: string;
  duracion_min?: number;
  num_personas?: number;
  estado?: string;
  notas?: string;
  cancelada_en?: string;
  cancelada_por?: number;
  motivo_cancelacion?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface ReservacionesGridRow {
  id?: number;
  sucursal_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  nombre_contacto?: string;
  telefono?: string;
  fecha_hora?: string;
  duracion_min?: number;
  num_personas?: number;
  estado?: string;
  notas?: string;
  cancelada_en?: string;
  cancelada_por?: number;
  motivo_cancelacion?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface ReservacionesCreateDTO {
  sucursal_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  nombre_contacto?: string;
  telefono?: string;
  fecha_hora?: string;
  duracion_min?: number;
  num_personas?: number;
  notas?: string;
  cancelada_en?: string;
  cancelada_por?: number;
  motivo_cancelacion?: string;
}

export interface ReservacionesUpdateDTO {
  sucursal_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  nombre_contacto?: string;
  telefono?: string;
  fecha_hora?: string;
  duracion_min?: number;
  num_personas?: number;
  notas?: string;
  cancelada_en?: string;
  cancelada_por?: number;
  motivo_cancelacion?: string;
}

export interface ReservacionesFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  mesa_id?: number;
  cliente_id?: number;
  nombre_contacto?: string;
  telefono?: string;
  fecha_hora?: string;
  duracion_min?: number;
  num_personas?: number;
  estado?: string;
  notas?: string;
  cancelada_en?: string;
  cancelada_por?: number;
  motivo_cancelacion?: string;
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
