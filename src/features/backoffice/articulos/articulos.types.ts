import type { GridieCellAction } from '@/lib/gridie';

export type ImagenCell = GridieCellAction[];

export interface Articulos {
  id?: number;
  familia_id?: number;
  subfamilia_id?: number;
  nombre?: string;
  descripcion?: string;
  referencia?: string;
  codigo_barras?: string;
  precio_venta?: number;
  coste?: number;
  tiene_stock?: boolean;
  vendido_por_peso?: boolean;
  impuesto_id?: number;
  tiempo_preparacion?: number;
  imagen?: string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface ArticulosGridRow {
  id?: number;
  familia_id?: number;
  subfamilia_id?: number;
  nombre?: string;
  descripcion?: string;
  precio_venta?: number;
  imagen?: ImagenCell | string;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface ArticulosCreateDTO {
  familia_id: number;
  subfamilia_id?: number;
  nombre: string;
  descripcion?: string;
  referencia?: string;
  codigo_barras?: string;
  precio_venta: number;
  coste?: number;
  tiene_stock?: boolean;
  vendido_por_peso?: boolean;
  impuesto_id?: number;
  tiempo_preparacion?: number;
  imagen: string;
}

export interface ArticulosUpdateDTO {
  familia_id?: number;
  subfamilia_id?: number;
  nombre?: string;
  descripcion?: string;
  referencia?: string;
  codigo_barras?: string;
  precio_venta?: number;
  coste?: number;
  tiene_stock?: boolean;
  vendido_por_peso?: boolean;
  impuesto_id?: number;
  tiempo_preparacion?: number;
  imagen?: string;
}

export interface ArticulosFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  familia_id?: number;
  subfamilia_id?: number;
  nombre?: string;
  descripcion?: string;
  referencia?: string;
  codigo_barras?: string;
  precio_venta?: number;
  coste?: number;
  tiene_stock?: boolean;
  vendido_por_peso?: boolean;
  impuesto_id?: number;
  tiempo_preparacion?: number;
  imagen?: string;
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
