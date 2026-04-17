import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import { withCreateMeta } from '@/utils/withCreateMeta';
import { withUpdateMeta } from '@/utils/withUpdateMeta';
import type { OrdenLineas, OrdenLineasCreateDTO, OrdenLineasUpdateDTO, OrdenLineasFilters, PaginatedResponse } from './ordenlineas.types';

const BASE = `${SERVER_ROUTE}/api/orden-lineas`;
const IS_SOFT_DELETE = true;

export const getAll = async () => {
  return filterExcluded(await http.get<OrdenLineas[]>(BASE));
};

export const getById = async (id: number) => {
  return await http.get<OrdenLineas>(`${BASE}/${id}`);
};

export const create = async (data: OrdenLineasCreateDTO) => {
  return await http.post<OrdenLineas>(BASE, withCreateMeta(data));
};

export const update = async (id: number, data: OrdenLineasUpdateDTO) => {
  return await http.patch<OrdenLineas>(`${BASE}/${id}`, withUpdateMeta(data));
};

export const remove = async (id: number, softDelete = IS_SOFT_DELETE) => {
  if (softDelete) {
    return await http.patch<void>(`${BASE}/${id}`, withUpdateMeta({ estado: 'eliminado' }));
  }
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: OrdenLineasFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<OrdenLineas>>(`${BASE}/paginated?${query}`);
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
