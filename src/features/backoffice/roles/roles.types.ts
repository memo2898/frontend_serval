import type { GridieCellAction } from '@/lib/gridie';

export interface Roles {
  id?: number;
  nombre?: string;
  descripcion?: string;
}

export interface RolesGridRow {
  id?: number;
  nombre?: string;
  descripcion?: string;
  actions?: GridieCellAction[];
}

export interface RolesCreateDTO {
  nombre?: string;
  descripcion?: string;
}

export interface RolesUpdateDTO {
  nombre?: string;
  descripcion?: string;
}

export interface RolesFilters {
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
