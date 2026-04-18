import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { ArticuloGruposModificadores, ArticuloGruposModificadoresCreateDTO, ArticuloGruposModificadoresUpdateDTO, ArticuloGruposModificadoresFilters, PaginatedResponse } from './articulogruposmodificadores.types';

const BASE = `${SERVER_ROUTE}/api/articulo-grupos-modificadores`;
export const getAll = async () => {
  return await http.get<ArticuloGruposModificadores[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<ArticuloGruposModificadores>(`${BASE}/${id}`);
};

export const create = async (data: ArticuloGruposModificadoresCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<ArticuloGruposModificadores>(BASE, payload);
};

export const update = async (id: number, data: ArticuloGruposModificadoresUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<ArticuloGruposModificadores>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: ArticuloGruposModificadoresFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<ArticuloGruposModificadores>>(`${BASE}/paginated?${query}`);
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
// Obtener un articulo_grupos_modificadore por ID
export const getCustom = async (articuloId: number, grupoId: number, _id: number) => {
  return await http.get<any>(`${BASE}/${articuloId}/${grupoId}`);
};

// Actualizar un articulo_grupos_modificadore
export const patchCustom = async (articuloId: number, grupoId: number, _id: number, data: any) => {
  return await http.patch<any>(`${BASE}/${articuloId}/${grupoId}`, data);
};

// Eliminar un articulo_grupos_modificadore
export const deleteCustom = async (articuloId: number, grupoId: number, _id: number) => {
  return await http.delete<any>(`${BASE}/${articuloId}/${grupoId}`);
};

