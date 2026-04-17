import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { Reservaciones, ReservacionesCreateDTO, ReservacionesUpdateDTO, ReservacionesFilters, PaginatedResponse } from './reservaciones.types';

const BASE = `${SERVER_ROUTE}/api/reservaciones`;
const IS_SOFT_DELETE = true;

export const getAll = async () => {
  return filterExcluded(await http.get<Reservaciones[]>(BASE));
};

export const getById = async (id: number) => {
  return await http.get<Reservaciones>(`${BASE}/${id}`);
};

export const create = async (data: ReservacionesCreateDTO) => {
  const payload = {
    ...data,
    estado: data.estado ?? 'pendiente',
    agregado_en: new Date().toISOString(),
  };
  return await http.post<Reservaciones>(BASE, payload);
};

export const update = async (id: number, data: ReservacionesUpdateDTO) => {
  const payload = {
    ...data,
    actualizado_en: new Date().toISOString(),
  };
  return await http.patch<Reservaciones>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number, softDelete = IS_SOFT_DELETE) => {
  if (softDelete) {
    return await http.patch<void>(`${BASE}/${id}`, {
      estado: 'eliminado',
      actualizado_en: new Date().toISOString(),
    });
  }
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ReservacionesFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Reservaciones>>(`${BASE}/paginated?${query}`);
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
