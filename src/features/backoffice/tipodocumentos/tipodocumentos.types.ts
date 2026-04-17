import type { GridieCellAction } from '@/lib/gridie';

export interface TipoDocumentos {
  id?: number;
  tipo?: string;
  aplica_a?: string;
  tipo_validacion?: string;
  regex_validacion?: string;
  funcion_validacion?: string;
  formato_ejemplo?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface TipoDocumentosGridRow {
  id?: number;
  tipo?: string;
  aplica_a?: string;
  tipo_validacion?: string;
  regex_validacion?: string;
  funcion_validacion?: string;
  formato_ejemplo?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface TipoDocumentosCreateDTO {
  tipo: string;
  aplica_a: string;
  tipo_validacion: string;
  regex_validacion: string;
  funcion_validacion: string;
  formato_ejemplo: string;
}

export interface TipoDocumentosUpdateDTO {
  tipo?: string;
  aplica_a?: string;
  tipo_validacion?: string;
  regex_validacion?: string;
  funcion_validacion?: string;
  formato_ejemplo?: string;
}

export interface TipoDocumentosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  tipo?: string;
  aplica_a?: string;
  tipo_validacion?: string;
  regex_validacion?: string;
  funcion_validacion?: string;
  formato_ejemplo?: string;
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
