import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { ComboArticulos, ComboArticulosCreateDTO, ComboArticulosUpdateDTO, ComboArticulosFilters, PaginatedResponse } from './comboarticulos.types';

const BASE = `${SERVER_ROUTE}/api/combo-articulos`;
export const getAll = async () => {
  return await http.get<ComboArticulos[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<ComboArticulos>(`${BASE}/${id}`);
};

export const create = async (data: ComboArticulosCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<ComboArticulos>(BASE, payload);
};

export const update = async (id: number, data: ComboArticulosUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<ComboArticulos>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ComboArticulosFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<ComboArticulos>>(`${BASE}/paginated?${query}`);
  return response;
};

const buildQuery = (params: object): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};
