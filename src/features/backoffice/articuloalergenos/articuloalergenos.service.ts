import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { ArticuloAlergenos, ArticuloAlergenosCreateDTO, ArticuloAlergenosUpdateDTO, ArticuloAlergenosFilters, PaginatedResponse } from './articuloalergenos.types';

const BASE = `${SERVER_ROUTE}/api/articulo-alergenos`;
export const getAll = async () => {
  return await http.get<ArticuloAlergenos[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<ArticuloAlergenos>(`${BASE}/${id}`);
};

export const create = async (data: ArticuloAlergenosCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<ArticuloAlergenos>(BASE, payload);
};

export const update = async (id: number, data: ArticuloAlergenosUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<ArticuloAlergenos>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ArticuloAlergenosFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<ArticuloAlergenos>>(`${BASE}/paginated?${query}`);
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
// Obtener un articulo_alergeno por ID
export const getCustom = async (articuloId: number, alergenoId: number, id: number) => {
  return await http.get<any>(`${BASE}/${articuloId}/${alergenoId}`);
};

// Actualizar un articulo_alergeno
export const patchCustom = async (articuloId: number, alergenoId: number, id: number, data: any) => {
  return await http.patch<any>(`${BASE}/${articuloId}/${alergenoId}`, data);
};

// Eliminar un articulo_alergeno
export const deleteCustom = async (articuloId: number, alergenoId: number, id: number) => {
  return await http.delete<any>(`${BASE}/${articuloId}/${alergenoId}`);
};

