import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { Permisos, PermisosCreateDTO, PermisosUpdateDTO, PermisosFilters, PaginatedResponse } from './permisos.types';

const BASE = `${SERVER_ROUTE}/api/permisos`;
export const getAll = async () => {
  return await http.get<Permisos[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Permisos>(`${BASE}/${id}`);
};

export const create = async (data: PermisosCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Permisos>(BASE, payload);
};

export const update = async (id: number, data: PermisosUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Permisos>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: PermisosFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Permisos>>(`${BASE}/paginated?${query}`);
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
