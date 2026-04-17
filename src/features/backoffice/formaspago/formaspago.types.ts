import type { GridieCellAction } from '@/lib/gridie';

export interface FormasPago {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  requiere_referencia?: boolean;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  sucursal_?: {
    id: number;
    nombre: string;
  };
}

export interface FormasPagoGridRow {
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  requiere_referencia?: boolean;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
  sucursal?: string;
}

export interface FormasPagoCreateDTO {
  sucursal_id: number;
  nombre: string;
  tipo: string;
  requiere_referencia: boolean;
}

export interface FormasPagoUpdateDTO {
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  requiere_referencia?: boolean;
}

export interface FormasPagoFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  nombre?: string;
  tipo?: string;
  requiere_referencia?: boolean;
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
