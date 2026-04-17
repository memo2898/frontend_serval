import type { GridieCellAction } from '@/lib/gridie';

export interface PreciosPorTarifa {
  id?: number;
  articulo_id?: number;
  tarifa_id?: number;
  precio?: number;
}

export interface PreciosPorTarifaGridRow {
  id?: number;
  articulo_id?: number;
  tarifa_id?: number;
  precio?: number;
  actions: GridieCellAction[];
}

export interface PreciosPorTarifaCreateDTO {
  articulo_id: number;
  tarifa_id: number;
  precio: number;
}

export interface PreciosPorTarifaUpdateDTO {
  articulo_id?: number;
  tarifa_id?: number;
  precio?: number;
}

export interface PreciosPorTarifaFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  articulo_id?: number;
  tarifa_id?: number;
  precio?: number;
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
