import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { Utils, UtilsCreateDTO, UtilsUpdateDTO, UtilsFilters, PaginatedResponse } from './utils.types';

const BASE = `${SERVER_ROUTE}/api/utils/health`;
export const getAll = async () => {
  return await http.get<Utils[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Utils>(`${BASE}/${id}`);
};

export const create = async (data: UtilsCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Utils>(BASE, payload);
};

export const update = async (id: number, data: UtilsUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Utils>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: UtilsFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Utils>>(`${BASE}/paginated?${query}`);
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
