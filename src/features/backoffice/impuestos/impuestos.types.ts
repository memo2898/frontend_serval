import type { GridieCellAction } from '@/lib/gridie';

export interface Impuestos {
  id?: number;
  pais_id?: number;
  nombre?: string;
  porcentaje?: number;
  tipo?: string;
  tipo_aplicacion?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface ImpuestosGridRow {
  id?: number;
  pais_id?: number;
  nombre?: string;
  porcentaje?: number;
  tipo?: string;
  tipo_aplicacion?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface ImpuestosCreateDTO {
  pais_id: number;
  nombre: string;
  porcentaje: number;
  tipo: string;
  tipo_aplicacion: string;
}

export interface ImpuestosUpdateDTO {
  pais_id?: number;
  nombre?: string;
  porcentaje?: number;
  tipo?: string;
  tipo_aplicacion?: string;
}

export interface ImpuestosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  pais_id?: number;
  nombre?: string;
  porcentaje?: number;
  tipo?: string;
  tipo_aplicacion?: string;
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
