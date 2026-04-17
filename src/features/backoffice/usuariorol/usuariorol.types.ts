import type { GridieCellAction } from '@/lib/gridie';

export interface UsuarioRol {
  id?: number;
  usuario_id?: number;
  rol_id?: number;
}

export interface UsuarioRolGridRow {
  id?: number;
  usuario_id?: number;
  rol_id?: number;
  actions: GridieCellAction[];
}

export interface UsuarioRolCreateDTO {
  usuario_id: number;
  rol_id: number;
}

export interface UsuarioRolUpdateDTO {
  usuario_id?: number;
  rol_id?: number;
}

export interface UsuarioRolFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  usuario_id?: number;
  rol_id?: number;
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
