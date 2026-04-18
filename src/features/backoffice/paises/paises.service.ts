import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { Paises, PaisesCreateDTO, PaisesUpdateDTO, PaisesFilters, PaginatedResponse } from './paises.types';

const BASE = `${SERVER_ROUTE}/api/paises`;
export const getAll = async () => {
  return await http.get<Paises[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Paises>(`${BASE}/${id}`);
};

export const create = async (data: PaisesCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Paises>(BASE, payload);
};

export const update = async (id: number, data: PaisesUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Paises>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: PaisesFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Paises>>(`${BASE}/paginated?${query}`);
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
