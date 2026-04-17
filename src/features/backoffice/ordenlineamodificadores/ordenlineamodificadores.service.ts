import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { OrdenLineaModificadores, OrdenLineaModificadoresCreateDTO, OrdenLineaModificadoresUpdateDTO, OrdenLineaModificadoresFilters, PaginatedResponse } from './ordenlineamodificadores.types';

const BASE = `${SERVER_ROUTE}/api/orden-linea-modificadores`;
export const getAll = async () => {
  return await http.get<OrdenLineaModificadores[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<OrdenLineaModificadores>(`${BASE}/${id}`);
};

export const create = async (data: OrdenLineaModificadoresCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<OrdenLineaModificadores>(BASE, payload);
};

export const update = async (id: number, data: OrdenLineaModificadoresUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<OrdenLineaModificadores>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: OrdenLineaModificadoresFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<OrdenLineaModificadores>>(`${BASE}/paginated?${query}`);
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
