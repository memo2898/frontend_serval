import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { Stock, StockCreateDTO, StockUpdateDTO, StockFilters, PaginatedResponse } from './stock.types';

const BASE = `${SERVER_ROUTE}/api/stock`;
export const getAll = async () => {
  return await http.get<Stock[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<Stock>(`${BASE}/${id}`);
};

export const create = async (data: StockCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<Stock>(BASE, payload);
};

export const update = async (id: number, data: StockUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<Stock>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: StockFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<Stock>>(`${BASE}/paginated?${query}`);
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

// ─── Endpoints adicionales ────────────────────────────────────────────────────
// Obtener un stock por ID
export const getCustom = async (articuloId: number, sucursalId: number, _id: number) => {
  return await http.get<any>(`${BASE}/${articuloId}/${sucursalId}`);
};

// Actualizar un stock
export const patchCustom = async (articuloId: number, sucursalId: number, _id: number, data: any) => {
  return await http.patch<any>(`${BASE}/${articuloId}/${sucursalId}`, data);
};

// Eliminar un stock
export const deleteCustom = async (articuloId: number, sucursalId: number, _id: number) => {
  return await http.delete<any>(`${BASE}/${articuloId}/${sucursalId}`);
};

