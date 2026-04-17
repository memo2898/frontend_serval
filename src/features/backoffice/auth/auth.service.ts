import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { Auth, AuthCreateDTO, AuthUpdateDTO, AuthFilters, PaginatedResponse } from './auth.types';

const BASE = `${SERVER_ROUTE}/api/auth/login`;
export const getAll = async () => {
  return await http.get<Auth[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Auth>(`${BASE}/${id}`);
};

export const create = async (data: AuthCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Auth>(BASE, payload);
};

export const update = async (id: number, data: AuthUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Auth>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: AuthFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Auth>>(`${BASE}/paginated?${query}`);
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
