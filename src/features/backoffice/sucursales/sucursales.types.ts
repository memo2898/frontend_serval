import type { GridieCellAction } from '@/lib/gridie';

export interface Sucursales {
  id?: number;
  empresa_id?: number;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface SucursalesGridRow {
  id?: number;
  empresa_id?: number;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface SucursalesCreateDTO {
  empresa_id?: number;
  nombre?: string;
  direccion?: string;
  telefono?: string;
}

export interface SucursalesUpdateDTO {
  empresa_id?: number;
  nombre?: string;
  direccion?: string;
  telefono?: string;
}

export interface SucursalesFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  empresa_id?: number;
  nombre?: string;
  direccion?: string;
  telefono?: string;
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
