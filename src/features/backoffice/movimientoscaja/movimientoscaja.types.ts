import type { GridieCellAction } from '@/lib/gridie';

export interface MovimientosCaja {
  id?: number;
  turno_id?: number;
  tipo?: string;
  monto?: number;
  concepto?: string;
  agregado_en?: string;
  agregado_por?: number;
}

export interface MovimientosCajaGridRow {
  id?: number;
  turno_id?: number;
  tipo?: string;
  monto?: number;
  concepto?: string;
  agregado_en?: string;
  agregado_por?: number;
  actions: GridieCellAction[];
}

export interface MovimientosCajaCreateDTO {
  turno_id: number;
  tipo: string;
  monto: number;
  concepto: string;
}

export interface MovimientosCajaUpdateDTO {
  turno_id?: number;
  tipo?: string;
  monto?: number;
  concepto?: string;
}

export interface MovimientosCajaFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  turno_id?: number;
  tipo?: string;
  monto?: number;
  concepto?: string;
  agregado_en?: string;
  agregado_por?: number;
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
