import type { GridieCellAction } from '@/lib/gridie';

export interface Empresas {
  id?: number;
  nombre?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  logo?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface EmpresasGridRow {
  id?: number;
  nombre?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  logo?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface EmpresasCreateDTO {
  nombre: string;
  tipo_documento_id: number;
  numero_documento: string;
  logo: string;
  estado: string;
}

export interface EmpresasUpdateDTO {
  nombre?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  logo?: string;
}

export interface EmpresasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  nombre?: string;
  tipo_documento_id?: number;
  numero_documento?: string;
  logo?: string;
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
