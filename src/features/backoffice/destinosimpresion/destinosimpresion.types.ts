import type { GridieCellAction } from '@/lib/gridie';

export interface DestinosImpresion {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  ip_impresora?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface DestinosImpresionGridRow {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  ip_impresora?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface DestinosImpresionCreateDTO {
  sucursal_id: number;
  nombre: string;
  tipo: string;
  ip_impresora: string;
}

export interface DestinosImpresionUpdateDTO {
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  ip_impresora?: string;
}

export interface DestinosImpresionFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  ip_impresora?: string;
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
