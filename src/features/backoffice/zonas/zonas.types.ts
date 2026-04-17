import type { GridieCellAction } from '@/lib/gridie';

export interface Zonas {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  orden_visual?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface ZonasGridRow {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  orden_visual?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface ZonasCreateDTO {
  sucursal_id: number;
  nombre: string;
  orden_visual: number;
}

export interface ZonasUpdateDTO {
  sucursal_id?: number;
  nombre?: string;
  orden_visual?: number;
}

export interface ZonasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  orden_visual?: number;
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
