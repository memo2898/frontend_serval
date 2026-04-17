import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import { withCreateMeta } from '@/utils/withCreateMeta';
import { withUpdateMeta } from '@/utils/withUpdateMeta';
import type { Clientes, ClientesCreateDTO, ClientesUpdateDTO, ClientesFilters, PaginatedResponse } from './clientes.types';

const BASE = `${SERVER_ROUTE}/api/clientes`;
const IS_SOFT_DELETE = true;

export const getAll = async () => {
  return filterExcluded(await http.get<Clientes[]>(BASE));
};

export const getById = async (id: number) => {
  return await http.get<Clientes>(`${BASE}/${id}`);
};

export const create = async (data: ClientesCreateDTO) => {
  return await http.post<Clientes>(BASE, withCreateMeta(data));
};

export const update = async (id: number, data: ClientesUpdateDTO) => {
  return await http.patch<Clientes>(`${BASE}/${id}`, withUpdateMeta(data));
};

export const remove = async (id: number, softDelete = IS_SOFT_DELETE) => {
  if (softDelete) {
    return await http.patch<void>(`${BASE}/${id}`, withUpdateMeta({ estado: 'eliminado' }));
  }
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ClientesFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Clientes>>(`${BASE}/paginated?${query}`);
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
