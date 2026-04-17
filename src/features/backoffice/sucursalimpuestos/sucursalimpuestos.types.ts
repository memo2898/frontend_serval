import type { GridieCellAction } from '@/lib/gridie';

export interface SucursalImpuestos {
  id?: number;
  sucursal_id?: number;
  impuesto_id?: number;
  obligatorio?: boolean;
  orden_aplicacion?: number;
}

export interface SucursalImpuestosGridRow {
  id?: number;
  sucursal_id?: number;
  impuesto_id?: number;
  obligatorio?: boolean;
  orden_aplicacion?: number;
  actions: GridieCellAction[];
}

export interface SucursalImpuestosCreateDTO {
  sucursal_id: number;
  impuesto_id: number;
  obligatorio: boolean;
  orden_aplicacion: number;
}

export interface SucursalImpuestosUpdateDTO {
  sucursal_id?: number;
  impuesto_id?: number;
  obligatorio?: boolean;
  orden_aplicacion?: number;
}

export interface SucursalImpuestosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  impuesto_id?: number;
  obligatorio?: boolean;
  orden_aplicacion?: number;
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
