import type { GridieCellAction } from '@/lib/gridie';

export interface Stock {
  id?: number;
  articulo_id?: number;
  sucursal_id?: number;
  cantidad_actual?: number;
  cantidad_minima?: number;
}

export interface StockGridRow {
  id?: number;
  articulo_id?: number;
  sucursal_id?: number;
  cantidad_actual?: number;
  cantidad_minima?: number;
  actions: GridieCellAction[];
}

export interface StockCreateDTO {
  articulo_id: number;
  sucursal_id: number;
  cantidad_actual: number;
  cantidad_minima: number;
}

export interface StockUpdateDTO {
  articulo_id?: number;
  sucursal_id?: number;
  cantidad_actual?: number;
  cantidad_minima?: number;
}

export interface StockFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  articulo_id?: number;
  sucursal_id?: number;
  cantidad_actual?: number;
  cantidad_minima?: number;
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
