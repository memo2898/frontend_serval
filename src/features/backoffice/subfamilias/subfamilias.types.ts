import type { GridieCellAction } from '@/lib/gridie';

export interface Subfamilias {
  id?: number;
  familia_id?: number;
  nombre?: string;
  orden_visual?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  familia?: {
    id: number;
    nombre: string;
    color?: string;
    icono?: string;
    orden_visual?: number;
    destino_impresion?: string;
    estado?: string;
  };
}

export interface SubfamiliasGridRow {
  id?: number;
  familia?: string;
  nombre?: string;
  orden_visual?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface SubfamiliasCreateDTO {
  familia_id: number;
  nombre: string;
  orden_visual: number;
}

export interface SubfamiliasUpdateDTO {
  familia_id?: number;
  nombre?: string;
  orden_visual?: number;
}

export interface SubfamiliasFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  familia_id?: number;
  nombre?: string;
  orden_visual?: number;
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
