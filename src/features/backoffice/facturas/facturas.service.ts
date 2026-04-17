import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { Facturas, FacturasCreateDTO, FacturasUpdateDTO, FacturasFilters, PaginatedResponse } from './facturas.types';

const BASE = `${SERVER_ROUTE}/api/facturas`;
export const getAll = async () => {
  return await http.get<Facturas[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Facturas>(`${BASE}/${id}`);
};

export const create = async (data: FacturasCreateDTO) => {
  const payload = {
    ...data,
    agregado_en: new Date().toISOString(),
  };
  return await http.post<Facturas>(BASE, payload);
};

export const update = async (id: number, data: FacturasUpdateDTO) => {
  const payload = {
    ...data,
    actualizado_en: new Date().toISOString(),
  };
  return await http.patch<Facturas>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: FacturasFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Facturas>>(`${BASE}/paginated?${query}`);
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
