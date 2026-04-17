import type { GridieCellAction } from '@/lib/gridie';

export interface Combos {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  precio?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface CombosGridRow {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  precio?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface CombosCreateDTO {
  sucursal_id: number;
  nombre: string;
  precio: number;
}

export interface CombosUpdateDTO {
  sucursal_id?: number;
  nombre?: string;
  precio?: number;
}

export interface CombosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  precio?: number;
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
