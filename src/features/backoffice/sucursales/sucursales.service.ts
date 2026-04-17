import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import { withCreateMeta } from '@/utils/withCreateMeta';
import { withUpdateMeta } from '@/utils/withUpdateMeta';
import type { Sucursales, SucursalesCreateDTO, SucursalesUpdateDTO, SucursalesFilters, PaginatedResponse } from './sucursales.types';

const BASE = `${SERVER_ROUTE}/api/sucursales`;
const IS_SOFT_DELETE = true;

export const getAll = async () => {
  return filterExcluded(await http.get<Sucursales[]>(BASE));
};

export const getById = async (id: number) => {
  return await http.get<Sucursales>(`${BASE}/${id}`);
};

export const create = async (data: SucursalesCreateDTO) => {
  return await http.post<Sucursales>(BASE, withCreateMeta(data));
};

export const update = async (id: number, data: SucursalesUpdateDTO) => {
  return await http.patch<Sucursales>(`${BASE}/${id}`, withUpdateMeta(data));
};

export const remove = async (id: number, softDelete = IS_SOFT_DELETE) => {
  if (softDelete) {
    return await http.patch<void>(`${BASE}/${id}`, withUpdateMeta({ estado: 'eliminado' }));
  }
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: SucursalesFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Sucursales>>(`${BASE}/paginated?${query}`);
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
