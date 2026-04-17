import type { GridieCellAction } from '@/lib/gridie';

export interface Mail {
  id?: number;
  to?: any;
  subject?: string;
  html?: string;
}

export interface MailGridRow {
  id?: number;
  to?: any;
  subject?: string;
  html?: string;
  actions: GridieCellAction[];
}

export interface MailCreateDTO {
  to: any;
  subject: string;
  html: string;
}

export interface MailUpdateDTO {
  to?: any;
  subject?: string;
  html?: string;
}

export interface MailFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  to?: any;
  subject?: string;
  html?: string;
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
