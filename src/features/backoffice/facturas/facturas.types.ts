import type { GridieCellAction } from '@/lib/gridie';

export interface Facturas {
  id?: number;
  orden_id?: number;
  cliente_id?: number;
  numero_factura?: string;
  tipo?: string;
  subtotal?: number;
  impuestos?: number;
  total?: number;
  anulada?: boolean;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface FacturasGridRow {
  id?: number;
  orden_id?: number;
  cliente_id?: number;
  numero_factura?: string;
  tipo?: string;
  subtotal?: number;
  impuestos?: number;
  total?: number;
  anulada?: boolean;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface FacturasCreateDTO {
  orden_id: number;
  cliente_id: number;
  numero_factura: string;
  tipo: string;
  subtotal: number;
  impuestos: number;
  total: number;
  anulada: boolean;
}

export interface FacturasUpdateDTO {
  orden_id?: number;
  cliente_id?: number;
  numero_factura?: string;
  tipo?: string;
  subtotal?: number;
  impuestos?: number;
  total?: number;
  anulada?: boolean;
}

export interface FacturasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  orden_id?: number;
  cliente_id?: number;
  numero_factura?: string;
  tipo?: string;
  subtotal?: number;
  impuestos?: number;
  total?: number;
  anulada?: boolean;
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
