import type { GridieCellAction } from '@/lib/gridie';

export interface ComboArticulos {
  id?: number;
  combo_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_especial?: number;
}

export interface ComboArticulosGridRow {
  id?: number;
  combo_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_especial?: number;
  actions: GridieCellAction[];
}

export interface ComboArticulosCreateDTO {
  combo_id: number;
  articulo_id: number;
  cantidad: number;
  precio_especial: number;
}

export interface ComboArticulosUpdateDTO {
  combo_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_especial?: number;
}

export interface ComboArticulosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  combo_id?: number;
  articulo_id?: number;
  cantidad?: number;
  precio_especial?: number;
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
