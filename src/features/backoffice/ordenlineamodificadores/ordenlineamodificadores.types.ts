import type { GridieCellAction } from '@/lib/gridie';

export interface OrdenLineaModificadores {
  id?: number;
  orden_linea_id?: number;
  modificador_id?: number;
  precio_extra?: number;
}

export interface OrdenLineaModificadoresGridRow {
  id?: number;
  orden_linea_id?: number;
  modificador_id?: number;
  precio_extra?: number;
  actions: GridieCellAction[];
}

export interface OrdenLineaModificadoresCreateDTO {
  orden_linea_id?: number;
  modificador_id?: number;
  precio_extra?: number;
}

export interface OrdenLineaModificadoresUpdateDTO {
  orden_linea_id?: number;
  modificador_id?: number;
  precio_extra?: number;
}

export interface OrdenLineaModificadoresFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  orden_linea_id?: number;
  modificador_id?: number;
  precio_extra?: number;
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
