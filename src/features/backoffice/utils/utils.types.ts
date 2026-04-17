import type { GridieCellAction } from '@/lib/gridie';

export interface Utils {
  id?: number;
  nombre?: string;
  descripcion?: string;
}

export interface UtilsGridRow {
  id?: number;
  nombre?: string;
  descripcion?: string;
  actions: GridieCellAction[];
}

export interface UtilsCreateDTO {
  nombre: string;
  descripcion?: string;
}

export interface UtilsUpdateDTO {
  nombre?: string;
  descripcion?: string;
}

export interface UtilsFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  nombre?: string;
  descripcion?: string;
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
