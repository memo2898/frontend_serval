import type { GridieCellAction } from '@/lib/gridie';

export interface Clientes {
  id?: number;
  empresa_id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  direccion?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface ClientesGridRow {
  id?: number;
  empresa_id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  direccion?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface ClientesCreateDTO {
  empresa_id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  direccion?: string;
}

export interface ClientesUpdateDTO {
  empresa_id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  direccion?: string;
}

export interface ClientesFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  empresa_id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  direccion?: string;
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
