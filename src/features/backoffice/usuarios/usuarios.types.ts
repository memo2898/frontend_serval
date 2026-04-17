import type { GridieCellAction } from '@/lib/gridie';

export interface Usuarios {
  id?: number;
  sucursal_id?: number;
  rol_id?: number;
  nombre?: string;
  apellido?: string;
  username?: string;
  pin?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface UsuariosGridRow {
  id?: number;
  sucursal_id?: number;
  rol_id?: number;
  nombre?: string;
  apellido?: string;
  username?: string;
  pin?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface UsuariosCreateDTO {
  sucursal_id: number;
  rol_id: number;
  nombre: string;
  apellido: string;
  username: string;
  pin: string;
}

export interface UsuariosUpdateDTO {
  sucursal_id?: number;
  rol_id?: number;
  nombre?: string;
  apellido?: string;
  username?: string;
  pin?: string;
}

export interface UsuariosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  rol_id?: number;
  nombre?: string;
  apellido?: string;
  username?: string;
  pin?: string;
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
