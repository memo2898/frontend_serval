import type { GridieCellAction } from '@/lib/gridie';

export interface Mesas {
  id?: number;
  zona_id?: number;
  nombre?: string;
  capacidad?: number;
  mesa_principal_id?: number;
  posicion_x?: number;
  posicion_y?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  zona?:{ nombre: string }
}

export interface MesasGridRow {
  id?: number;
  zona_id?: number;
  nombre?: string;
  capacidad?: number;
  mesa_principal_id?: number;
  posicion_x?: number;
  posicion_y?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
  zona?:string;
}

export interface MesasCreateDTO {
  zona_id: number;
  nombre: string;
  capacidad: number;
  mesa_principal_id: number;
  posicion_x: number;
  posicion_y: number;
}

export interface MesasUpdateDTO {
  zona_id?: number;
  nombre?: string;
  capacidad?: number;
  mesa_principal_id?: number;
  posicion_x?: number;
  posicion_y?: number;
}

export interface MesasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  zona_id?: number;
  nombre?: string;
  capacidad?: number;
  mesa_principal_id?: number;
  posicion_x?: number;
  posicion_y?: number;
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
