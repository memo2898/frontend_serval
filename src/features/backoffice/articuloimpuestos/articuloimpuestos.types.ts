import type { GridieCellAction } from '@/lib/gridie';

export interface ArticuloImpuestos {
  id?: number;
  articulo_id?: number;
  impuesto_id?: number;
}

export interface ArticuloImpuestosGridRow {
  id?: number;
  articulo_id?: number;
  impuesto_id?: number;
  actions: GridieCellAction[];
}

export interface ArticuloImpuestosCreateDTO {
  articulo_id: number;
  impuesto_id: number;
}

export interface ArticuloImpuestosUpdateDTO {
  articulo_id?: number;
  impuesto_id?: number;
}

export interface ArticuloImpuestosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  articulo_id?: number;
  impuesto_id?: number;
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
