import type { GridieCellAction } from '@/lib/gridie';

export interface Familias {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  color?: string;
  icono?: string;
  orden_visual?: number;
  destino_impresion?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface FamiliasGridRow {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  color?: string;
  icono?: string;
  orden_visual?: number;
  destino_impresion?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface FamiliasCreateDTO {
  sucursal_id: number;
  nombre: string;
  color: string;
  icono: string;
  orden_visual: number;
  destino_impresion: string;
}

export interface FamiliasUpdateDTO {
  sucursal_id?: number;
  nombre?: string;
  color?: string;
  icono?: string;
  orden_visual?: number;
  destino_impresion?: string;
}

export interface FamiliasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  color?: string;
  icono?: string;
  orden_visual?: number;
  destino_impresion?: string;
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
