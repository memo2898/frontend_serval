import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { UsuarioRol, UsuarioRolCreateDTO, UsuarioRolUpdateDTO, UsuarioRolFilters, PaginatedResponse } from './usuariorol.types';

const BASE = `${SERVER_ROUTE}/api/usuario-rol`;
export const getAll = async () => {
  return await http.get<UsuarioRol[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<UsuarioRol>(`${BASE}/${id}`);
};

export const create = async (data: UsuarioRolCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<UsuarioRol>(BASE, payload);
};

export const update = async (id: number, data: UsuarioRolUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<UsuarioRol>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: UsuarioRolFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<UsuarioRol>>(`${BASE}/paginated?${query}`);
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
// Obtener un usuario_rol por PK compuesta
export const getCustom = async (usuarioId: number, rolId: number) => {
  return await http.get<any>(`${BASE}/${usuarioId}/${rolId}`);
};

// Actualizar un usuario_rol
export const patchCustom = async (usuarioId: number, rolId: number, data: any) => {
  return await http.patch<any>(`${BASE}/${usuarioId}/${rolId}`, data);
};

// Quitar un rol de un usuario
export const deleteCustom = async (usuarioId: number, rolId: number) => {
  return await http.delete<any>(`${BASE}/${usuarioId}/${rolId}`);
};

