import type { GridieCellAction } from '@/lib/gridie';

export interface Alergenos {
  id?: number;
  nombre?: string;
  icono?: string;
}

export interface AlergenosGridRow {
  id?: number;
  nombre?: string;
  icono?: string;
  actions: GridieCellAction[];
}

export interface AlergenosCreateDTO {
  nombre: string;
  icono: string;
}

export interface AlergenosUpdateDTO {
  nombre?: string;
  icono?: string;
}

export interface AlergenosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  nombre?: string;
  icono?: string;
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
