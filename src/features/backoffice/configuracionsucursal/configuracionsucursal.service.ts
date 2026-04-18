import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { ConfiguracionSucursal, ConfiguracionSucursalCreateDTO, ConfiguracionSucursalUpdateDTO, ConfiguracionSucursalFilters, PaginatedResponse } from './configuracionsucursal.types';

const BASE = `${SERVER_ROUTE}/api/configuracion-sucursal`;
export const getAll = async () => {
  return await http.get<ConfiguracionSucursal[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<ConfiguracionSucursal>(`${BASE}/${id}`);
};

export const create = async (data: ConfiguracionSucursalCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<ConfiguracionSucursal>(BASE, payload);
};

export const update = async (id: number, data: ConfiguracionSucursalUpdateDTO) => {
  const payload = {
    ...data,
    actualizado_en: new Date().toISOString(),
  };
  return await http.patch<ConfiguracionSucursal>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ConfiguracionSucursalFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<ConfiguracionSucursal>>(`${BASE}/paginated?${query}`);
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
