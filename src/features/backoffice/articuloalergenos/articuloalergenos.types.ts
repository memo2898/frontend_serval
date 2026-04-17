import type { GridieCellAction } from '@/lib/gridie';

export interface ArticuloAlergenos {
  id?: number;
  articulo_id?: number;
  alergeno_id?: number;
}

export interface ArticuloAlergenosGridRow {
  id?: number;
  articulo_id?: number;
  alergeno_id?: number;
  actions: GridieCellAction[];
}

export interface ArticuloAlergenosCreateDTO {
  articulo_id: number;
  alergeno_id: number;
}

export interface ArticuloAlergenosUpdateDTO {
  articulo_id?: number;
  alergeno_id?: number;
}

export interface ArticuloAlergenosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  articulo_id?: number;
  alergeno_id?: number;
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
