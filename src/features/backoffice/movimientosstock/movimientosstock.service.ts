import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { MovimientosStock, MovimientosStockCreateDTO, MovimientosStockUpdateDTO, MovimientosStockFilters, PaginatedResponse } from './movimientosstock.types';

const BASE = `${SERVER_ROUTE}/api/movimientos-stock`;
export const getAll = async () => {
  return await http.get<MovimientosStock[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<MovimientosStock>(`${BASE}/${id}`);
};

export const create = async (data: MovimientosStockCreateDTO) => {
  const payload = {
    ...data,
    agregado_en: new Date().toISOString(),
  };
  return await http.post<MovimientosStock>(BASE, payload);
};

export const update = async (id: number, data: MovimientosStockUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<MovimientosStock>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: MovimientosStockFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<MovimientosStock>>(`${BASE}/paginated?${query}`);
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
