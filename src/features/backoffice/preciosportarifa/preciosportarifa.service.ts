import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { PreciosPorTarifa, PreciosPorTarifaCreateDTO, PreciosPorTarifaUpdateDTO, PreciosPorTarifaFilters, PaginatedResponse } from './preciosportarifa.types';

const BASE = `${SERVER_ROUTE}/api/precios-por-tarifa`;
export const getAll = async () => {
  return await http.get<PreciosPorTarifa[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<PreciosPorTarifa>(`${BASE}/${id}`);
};

export const create = async (data: PreciosPorTarifaCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<PreciosPorTarifa>(BASE, payload);
};

export const update = async (id: number, data: PreciosPorTarifaUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<PreciosPorTarifa>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: PreciosPorTarifaFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<PreciosPorTarifa>>(`${BASE}/paginated?${query}`);
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
