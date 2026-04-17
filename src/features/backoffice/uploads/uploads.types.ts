import type { GridieCellAction } from '@/lib/gridie';

export interface Uploads {
  id?: number;
  0?: string;
}

export interface UploadsGridRow {
  id?: number;
  0?: string;
  actions: GridieCellAction[];
}

export interface UploadsCreateDTO {
  0: string;
}

export interface UploadsUpdateDTO {
  0?: string;
}

export interface UploadsFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  0?: string;
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
