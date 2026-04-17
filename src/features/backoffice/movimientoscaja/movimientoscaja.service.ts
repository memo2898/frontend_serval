import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { MovimientosCaja, MovimientosCajaCreateDTO, MovimientosCajaUpdateDTO, MovimientosCajaFilters, PaginatedResponse } from './movimientoscaja.types';

const BASE = `${SERVER_ROUTE}/api/movimientos-caja`;
export const getAll = async () => {
  return await http.get<MovimientosCaja[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<MovimientosCaja>(`${BASE}/${id}`);
};

export const create = async (data: MovimientosCajaCreateDTO) => {
  const payload = {
    ...data,
    agregado_en: new Date().toISOString(),
  };
  return await http.post<MovimientosCaja>(BASE, payload);
};

export const update = async (id: number, data: MovimientosCajaUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<MovimientosCaja>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: MovimientosCajaFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<MovimientosCaja>>(`${BASE}/paginated?${query}`);
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
