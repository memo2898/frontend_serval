import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import { withCreateMeta } from '@/utils/withCreateMeta';
import { withUpdateMeta } from '@/utils/withUpdateMeta';
import type { Modificadores, ModificadoresCreateDTO, ModificadoresUpdateDTO, ModificadoresFilters, PaginatedResponse } from './modificadores.types';

const BASE = `${SERVER_ROUTE}/api/modificadores`;
const IS_SOFT_DELETE = true;

export const getAll = async () => {
  return filterExcluded(await http.get<Modificadores[]>(BASE));
};

export const getById = async (id: number) => {
  return await http.get<Modificadores>(`${BASE}/${id}`);
};

export const create = async (data: ModificadoresCreateDTO) => {
  return await http.post<Modificadores>(BASE, withCreateMeta(data));
};

export const update = async (id: number, data: ModificadoresUpdateDTO) => {
  return await http.patch<Modificadores>(`${BASE}/${id}`, withUpdateMeta(data));
};

export const remove = async (id: number, softDelete = IS_SOFT_DELETE) => {
  if (softDelete) {
    return await http.patch<void>(`${BASE}/${id}`, withUpdateMeta({ estado: 'eliminado' }));
  }
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ModificadoresFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Modificadores>>(`${BASE}/paginated?${query}`);
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
