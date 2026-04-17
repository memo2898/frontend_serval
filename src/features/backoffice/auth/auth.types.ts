import type { GridieCellAction } from '@/lib/gridie';

export interface Auth {
  id?: number;
  username?: string;
  password?: string;
}

export interface AuthGridRow {
  id?: number;
  username?: string;
  password?: string;
  actions: GridieCellAction[];
}

export interface AuthCreateDTO {
  username: string;
  password: string;
}

export interface AuthUpdateDTO {
  username?: string;
  password?: string;
}

export interface AuthFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  username?: string;
  password?: string;
}

export interface LoginUserRole {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface LoginUser {
  id: number;
  sucursal_id: number | null;
  nombre: string;
  apellido: string;
  username: string;
  pin: string;
  estado: string;
  agregado_en: string;
  actualizado_en: string;
  agregado_por: number | null;
  actualizado_por: number | null;
  sucursal: null;
  roles: LoginUserRole[];
}

export interface LoginResponse {
  access_token: string;
  user: LoginUser;
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
