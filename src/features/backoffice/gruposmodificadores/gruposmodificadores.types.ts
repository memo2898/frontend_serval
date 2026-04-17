import type { GridieCellAction } from '@/lib/gridie';

export interface GruposModificadores {
  id?: number;
  nombre?: string;
  tipo?: string;
  seleccion?: string;
  obligatorio?: boolean;
  min_seleccion?: number;
  max_seleccion?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface GruposModificadoresGridRow {
  id?: number;
  nombre?: string;
  tipo?: string;
  seleccion?: string;
  obligatorio?: boolean;
  min_seleccion?: number;
  max_seleccion?: number;
  estado?: string;
  agregado_en?: string;
  agregado_por?: number;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface GruposModificadoresCreateDTO {
  nombre?: string;
  tipo?: string;
  seleccion?: string;
  obligatorio?: boolean;
  min_seleccion?: number;
  max_seleccion?: number;
}

export interface GruposModificadoresUpdateDTO {
  nombre?: string;
  tipo?: string;
  seleccion?: string;
  obligatorio?: boolean;
  min_seleccion?: number;
  max_seleccion?: number;
}

export interface GruposModificadoresFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  nombre?: string;
  tipo?: string;
  seleccion?: string;
  obligatorio?: boolean;
  min_seleccion?: number;
  max_seleccion?: number;
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
