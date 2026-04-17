import type { GridieCellAction } from '@/lib/gridie';

export interface ArticuloGruposModificadores {
  id?: number;
  articulo_id?: number;
  grupo_modificador_id?: number;
  articuloId?: number;
  grupoId?: number;
}

export interface ArticuloGruposModificadoresGridRow {
  id?: number;
  articulo_id?: number;
  grupo_modificador_id?: number;
  articuloId?: number;
  grupoId?: number;
  actions: GridieCellAction[];
}

export interface ArticuloGruposModificadoresCreateDTO {
  articulo_id: number;
  grupo_modificador_id: number;
}

export interface ArticuloGruposModificadoresUpdateDTO {
  articulo_id?: number;
  grupo_modificador_id?: number;
  articuloId?: number;
  grupoId?: number;
}

export interface ArticuloGruposModificadoresFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  articulo_id?: number;
  grupo_modificador_id?: number;
  articuloId?: number;
  grupoId?: number;
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
