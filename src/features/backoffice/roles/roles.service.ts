import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { Roles, RolesCreateDTO, RolesUpdateDTO, RolesFilters, PaginatedResponse } from './roles.types';

const BASE = `${SERVER_ROUTE}/api/roles`;
export const getAll = async () => {
  return await http.get<Roles[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Roles>(`${BASE}/${id}`);
};

export const create = async (data: RolesCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Roles>(BASE, payload);
};

export const update = async (id: number, data: RolesUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Roles>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: RolesFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Roles>>(`${BASE}/paginated?${query}`);
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
