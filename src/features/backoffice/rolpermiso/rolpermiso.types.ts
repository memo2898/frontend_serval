import type { GridieCellAction } from '@/lib/gridie';

export interface RolPermiso {
  id?: number;
  rol_id?: number;
  permiso_id?: number;
}

export interface RolPermisoGridRow {
  id?: number;
  rol_id?: number;
  permiso_id?: number;
  actions: GridieCellAction[];
}

export interface RolPermisoCreateDTO {
  rol_id: number;
  permiso_id: number;
}

export interface RolPermisoUpdateDTO {
  rol_id?: number;
  permiso_id?: number;
}

export interface RolPermisoFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  rol_id?: number;
  permiso_id?: number;
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
