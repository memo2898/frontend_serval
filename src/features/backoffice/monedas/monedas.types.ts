import type { GridieCellAction } from '@/lib/gridie';

export interface Monedas {
  id?: number;
  codigo?: string;
  nombre?: string;
  simbolo?: string;
  decimales?: number;
  estado?: string;
}

export interface MonedasGridRow {
  id?: number;
  codigo?: string;
  nombre?: string;
  simbolo?: string;
  decimales?: number;
  estado?: string;
  actions: GridieCellAction[];
}

export interface MonedasCreateDTO {
  codigo: string;
  nombre: string;
  simbolo: string;
  decimales: number;
}

export interface MonedasUpdateDTO {
  codigo?: string;
  nombre?: string;
  simbolo?: string;
  decimales?: number;
}

export interface MonedasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  codigo?: string;
  nombre?: string;
  simbolo?: string;
  decimales?: number;
  estado?: string;
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
