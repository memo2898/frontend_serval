import type { GridieCellAction } from '@/lib/gridie';

export interface Modificadores {
  id?: number;
  grupo_modificador_id?: number;
  nombre?: string;
  precio_extra?: number;
  orden_visual?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface ModificadoresGridRow {
  id?: number;
  grupo_modificador_id?: number;
  nombre?: string;
  precio_extra?: number;
  orden_visual?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface ModificadoresCreateDTO {
  grupo_modificador_id?: number;
  nombre?: string;
  precio_extra?: number;
  orden_visual?: number;
}

export interface ModificadoresUpdateDTO {
  grupo_modificador_id?: number;
  nombre?: string;
  precio_extra?: number;
  orden_visual?: number;
}

export interface ModificadoresFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  grupo_modificador_id?: number;
  nombre?: string;
  precio_extra?: number;
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
