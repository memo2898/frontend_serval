import type { GridieCellAction } from '@/lib/gridie';

export interface TurnosCaja {
  id?: number;
  terminal_id?: number;
  usuario_id?: number;
  fecha_apertura?: string;
  fecha_cierre?: string;
  monto_apertura?: number;
  monto_cierre_declarado?: number;
  monto_cierre_real?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface TurnosCajaGridRow {
  id?: number;
  terminal_id?: number;
  usuario_id?: number;
  fecha_apertura?: string;
  fecha_cierre?: string;
  monto_apertura?: number;
  monto_cierre_declarado?: number;
  monto_cierre_real?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface TurnosCajaCreateDTO {
  terminal_id: number;
  usuario_id: number;
  fecha_apertura: string;
  fecha_cierre: string;
  monto_apertura: number;
  monto_cierre_declarado: number;
  monto_cierre_real: number;
}

export interface TurnosCajaUpdateDTO {
  terminal_id?: number;
  usuario_id?: number;
  fecha_apertura?: string;
  fecha_cierre?: string;
  monto_apertura?: number;
  monto_cierre_declarado?: number;
  monto_cierre_real?: number;
}

export interface TurnosCajaFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  terminal_id?: number;
  usuario_id?: number;
  fecha_apertura?: string;
  fecha_cierre?: string;
  monto_apertura?: number;
  monto_cierre_declarado?: number;
  monto_cierre_real?: number;
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
