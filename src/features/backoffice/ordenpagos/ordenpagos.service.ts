import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { OrdenPagos, OrdenPagosCreateDTO, OrdenPagosUpdateDTO, OrdenPagosFilters, PaginatedResponse } from './ordenpagos.types';

const BASE = `${SERVER_ROUTE}/api/orden-pagos`;
export const getAll = async () => {
  return await http.get<OrdenPagos[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<OrdenPagos>(`${BASE}/${id}`);
};

export const create = async (data: OrdenPagosCreateDTO) => {
  const payload = {
    ...data,
    agregado_en: new Date().toISOString(),
  };
  return await http.post<OrdenPagos>(BASE, payload);
};

export const update = async (id: number, data: OrdenPagosUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<OrdenPagos>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: OrdenPagosFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<OrdenPagos>>(`${BASE}/paginated?${query}`);
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
