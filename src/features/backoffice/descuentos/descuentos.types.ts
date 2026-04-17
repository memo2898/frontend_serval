import type { GridieCellAction } from '@/lib/gridie';

export interface Descuentos {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  valor?: number;
  aplica_a?: string;
  requiere_autorizacion?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface DescuentosGridRow {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  valor?: number;
  aplica_a?: string;
  requiere_autorizacion?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface DescuentosCreateDTO {
  sucursal_id: number;
  nombre: string;
  tipo: string;
  valor: number;
  aplica_a: string;
  requiere_autorizacion: boolean;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface DescuentosUpdateDTO {
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  valor?: number;
  aplica_a?: string;
  requiere_autorizacion?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface DescuentosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  valor?: number;
  aplica_a?: string;
  requiere_autorizacion?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
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
