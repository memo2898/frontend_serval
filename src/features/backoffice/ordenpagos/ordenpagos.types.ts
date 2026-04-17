import type { GridieCellAction } from '@/lib/gridie';

export interface OrdenPagos {
  id?: number;
  orden_id?: number;
  forma_pago_id?: number;
  monto?: number;
  referencia?: string;
  agregado_en?: string;
  agregado_por?: number;
}

export interface OrdenPagosGridRow {
  id?: number;
  orden_id?: number;
  forma_pago_id?: number;
  monto?: number;
  referencia?: string;
  agregado_en?: string;
  agregado_por?: number;
  actions: GridieCellAction[];
}

export interface OrdenPagosCreateDTO {
  orden_id: number;
  forma_pago_id: number;
  monto: number;
  referencia: string;
}

export interface OrdenPagosUpdateDTO {
  orden_id?: number;
  forma_pago_id?: number;
  monto?: number;
  referencia?: string;
}

export interface OrdenPagosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  orden_id?: number;
  forma_pago_id?: number;
  monto?: number;
  referencia?: string;
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
