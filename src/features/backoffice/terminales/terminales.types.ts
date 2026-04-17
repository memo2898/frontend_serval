import type { GridieCellAction } from '@/lib/gridie';

export interface Terminales {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface TerminalesGridRow {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface TerminalesCreateDTO {
  sucursal_id?: number;
  nombre?: string;
}

export interface TerminalesUpdateDTO {
  sucursal_id?: number;
  nombre?: string;
}

export interface TerminalesFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
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
