import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { SucursalImpuestos, SucursalImpuestosCreateDTO, SucursalImpuestosUpdateDTO, SucursalImpuestosFilters, PaginatedResponse } from './sucursalimpuestos.types';

const BASE = `${SERVER_ROUTE}/api/sucursal-impuestos`;
export const getAll = async () => {
  return await http.get<SucursalImpuestos[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<SucursalImpuestos>(`${BASE}/${id}`);
};

export const create = async (data: SucursalImpuestosCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<SucursalImpuestos>(BASE, payload);
};

export const update = async (id: number, data: SucursalImpuestosUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<SucursalImpuestos>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: SucursalImpuestosFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<SucursalImpuestos>>(`${BASE}/paginated?${query}`);
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
// Obtener un impuesto de una sucursal por PK compuesta
export const getCustom = async (sucursalId: number, impuestoId: number) => {
  return await http.get<any>(`${BASE}/${sucursalId}/${impuestoId}`);
};

// Actualizar un impuesto de una sucursal
export const patchCustom = async (sucursalId: number, impuestoId: number, data: any) => {
  return await http.patch<any>(`${BASE}/${sucursalId}/${impuestoId}`, data);
};

// Eliminar un impuesto de una sucursal
export const deleteCustom = async (sucursalId: number, impuestoId: number) => {
  return await http.delete<any>(`${BASE}/${sucursalId}/${impuestoId}`);
};

