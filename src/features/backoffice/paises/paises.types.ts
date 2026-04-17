import type { GridieCellAction } from '@/lib/gridie';

export interface Paises {
  id?: number;
  nombre?: string;
  codigo_iso?: string;
  moneda_id?: number;
  moneda?: Moneda
}

interface Moneda {
  id?: number;
  nombre?: string;
  simbolo?: string;
}

export interface PaisesGridRow {
  id?: number;
  nombre?: string;
  codigo_iso?: string;
  moneda_id?: number;
  moneda?: string;
  actions: GridieCellAction[];
}

export interface PaisesCreateDTO {
  nombre?: string;
  codigo_iso?: string;
  moneda_id?: number;
}

export interface PaisesUpdateDTO {
  nombre?: string;
  codigo_iso?: string;
  moneda_id?: number;
}

export interface PaisesFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  nombre?: string;
  codigo_iso?: string;
  moneda_id?: number;
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
