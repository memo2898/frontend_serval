import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { Monedas, MonedasCreateDTO, MonedasUpdateDTO, MonedasFilters, PaginatedResponse } from './monedas.types';

const BASE = `${SERVER_ROUTE}/api/monedas`;
const IS_SOFT_DELETE = true;

export const getAll = async () => {
  return filterExcluded(await http.get<Monedas[]>(BASE));
};

export const getById = async (id: number) => {
  return await http.get<Monedas>(`${BASE}/${id}`);
};

export const create = async (data: MonedasCreateDTO) => {
  const payload = {
    ...data,
    estado: 'ACTIVO',
  };
  return await http.post<Monedas>(BASE, payload);
};

export const update = async (id: number, data: MonedasUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Monedas>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number, softDelete = IS_SOFT_DELETE) => {
  if (softDelete) {
    return await http.patch<void>(`${BASE}/${id}`, {
      estado: 'ELIMINADO',
    });
  }
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: MonedasFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Monedas>>(`${BASE}/paginated?${query}`);
  if (!filters.estado) {
    return { ...response, data: filterExcluded(response.data) };
  }
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
