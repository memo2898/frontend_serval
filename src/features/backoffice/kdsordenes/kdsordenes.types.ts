import type { GridieCellAction } from '@/lib/gridie';

export interface KdsOrdenes {
  id?: number;
  orden_linea_id?: number;
  destino_id?: number;
  estado?: string;
  tiempo_recibido?: string;
  tiempo_preparado?: string;
}

export interface KdsOrdenesGridRow {
  id?: number;
  orden_linea_id?: number;
  destino_id?: number;
  estado?: string;
  tiempo_recibido?: string;
  tiempo_preparado?: string;
  actions: GridieCellAction[];
}

export interface KdsOrdenesCreateDTO {
  orden_linea_id?: number;
  destino_id?: number;
  tiempo_recibido?: string;
  tiempo_preparado?: string;
}

export interface KdsOrdenesUpdateDTO {
  orden_linea_id?: number;
  destino_id?: number;
  tiempo_recibido?: string;
  tiempo_preparado?: string;
}

export interface KdsOrdenesFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  orden_linea_id?: number;
  destino_id?: number;
  estado?: string;
  tiempo_recibido?: string;
  tiempo_preparado?: string;
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
