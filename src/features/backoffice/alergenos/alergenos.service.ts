import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { Alergenos, AlergenosCreateDTO, AlergenosUpdateDTO, AlergenosFilters, PaginatedResponse } from './alergenos.types';

const BASE = `${SERVER_ROUTE}/api/alergenos`;
export const getAll = async () => {
  return await http.get<Alergenos[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Alergenos>(`${BASE}/${id}`);
};

export const create = async (data: AlergenosCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Alergenos>(BASE, payload);
};

export const update = async (id: number, data: AlergenosUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Alergenos>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: AlergenosFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Alergenos>>(`${BASE}/paginated?${query}`);
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
