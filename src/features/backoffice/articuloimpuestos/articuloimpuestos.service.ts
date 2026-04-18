import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { ArticuloImpuestos, ArticuloImpuestosCreateDTO, ArticuloImpuestosUpdateDTO, ArticuloImpuestosFilters, PaginatedResponse } from './articuloimpuestos.types';

const BASE = `${SERVER_ROUTE}/api/articulo-impuestos`;
export const getAll = async () => {
  return await http.get<ArticuloImpuestos[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<ArticuloImpuestos>(`${BASE}/${id}`);
};

export const create = async (data: ArticuloImpuestosCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<ArticuloImpuestos>(BASE, payload);
};

export const update = async (id: number, data: ArticuloImpuestosUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<ArticuloImpuestos>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ArticuloImpuestosFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<ArticuloImpuestos>>(`${BASE}/paginated?${query}`);
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
// Obtener un articulo_impuesto por ID
export const getCustom = async (articuloId: number, impuestoId: number, _id: number) => {
  return await http.get<any>(`${BASE}/${articuloId}/${impuestoId}`);
};

// Actualizar un articulo_impuesto
export const patchCustom = async (articuloId: number, impuestoId: number, _id: number, data: any) => {
  return await http.patch<any>(`${BASE}/${articuloId}/${impuestoId}`, data);
};

// Eliminar un articulo_impuesto
export const deleteCustom = async (articuloId: number, impuestoId: number, _id: number) => {
  return await http.delete<any>(`${BASE}/${articuloId}/${impuestoId}`);
};

