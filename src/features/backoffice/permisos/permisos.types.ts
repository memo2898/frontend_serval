import type { GridieCellAction } from '@/lib/gridie';

export interface Permisos {
  id?: number;
  codigo?: string;
  descripcion?: string;
}

export interface PermisosGridRow {
  id?: number;
  codigo?: string;
  descripcion?: string;
  actions?: GridieCellAction[];
}

export interface PermisosCreateDTO {
  codigo: string;
  descripcion: string;
}

export interface PermisosUpdateDTO {
  codigo?: string;
  descripcion?: string;
}

export interface PermisosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  codigo?: string;
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
