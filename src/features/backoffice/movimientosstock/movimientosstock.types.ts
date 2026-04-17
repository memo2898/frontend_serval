import type { GridieCellAction } from '@/lib/gridie';

export interface MovimientosStock {
  id?: number;
  articulo_id?: number;
  sucursal_id?: number;
  tipo?: string;
  cantidad?: number;
  referencia?: string;
  orden_id?: number;
  agregado_en?: string;
  agregado_por?: number;
}

export interface MovimientosStockGridRow {
  id?: number;
  articulo_id?: number;
  sucursal_id?: number;
  tipo?: string;
  cantidad?: number;
  referencia?: string;
  orden_id?: number;
  agregado_en?: string;
  agregado_por?: number;
  actions: GridieCellAction[];
}

export interface MovimientosStockCreateDTO {
  articulo_id: number;
  sucursal_id: number;
  tipo: string;
  cantidad: number;
  referencia: string;
  orden_id: number;
}

export interface MovimientosStockUpdateDTO {
  articulo_id?: number;
  sucursal_id?: number;
  tipo?: string;
  cantidad?: number;
  referencia?: string;
  orden_id?: number;
}

export interface MovimientosStockFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  articulo_id?: number;
  sucursal_id?: number;
  tipo?: string;
  cantidad?: number;
  referencia?: string;
  orden_id?: number;
  agregado_en?: string;
  agregado_por?: number;
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
