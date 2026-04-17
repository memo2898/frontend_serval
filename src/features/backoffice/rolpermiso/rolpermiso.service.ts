import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import { filterExcluded } from '@/utils/filterExcluded';
import type { RolPermiso, RolPermisoCreateDTO, RolPermisoUpdateDTO, RolPermisoFilters, PaginatedResponse } from './rolpermiso.types';

const BASE = `${SERVER_ROUTE}/api/rol-permiso`;
export const getAll = async () => {
  return await http.get<RolPermiso[]>(BASE);
};

export const getById = async (id: number) => {
  return await http.get<RolPermiso>(`${BASE}/${id}`);
};

export const create = async (data: RolPermisoCreateDTO) => {
  const payload = {
    ...data,
  };
  return await http.post<RolPermiso>(BASE, payload);
};

export const update = async (id: number, data: RolPermisoUpdateDTO) => {
  const payload = {
    ...data,
  };
  return await http.patch<RolPermiso>(`${BASE}/${id}`, payload);
};

export const remove = async (id: number) => {
  return await http.delete<void>(`${BASE}/${id}`);
};

export const getPaginated = async (filters: RolPermisoFilters = {}) => {
  const query = buildQuery(filters);
  const response = await http.get<PaginatedResponse<RolPermiso>>(`${BASE}/paginated?${query}`);
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
// Obtener un rol_permiso por ID
export const getCustom = async (rolId: number, permisoId: number, id: number) => {
  return await http.get<any>(`${BASE}/${rolId}/${permisoId}`);
};

// Actualizar un rol_permiso
export const patchCustom = async (rolId: number, permisoId: number, id: number, data: any) => {
  return await http.patch<any>(`${BASE}/${rolId}/${permisoId}`, data);
};

// Eliminar un rol_permiso
export const deleteCustom = async (rolId: number, permisoId: number, id: number) => {
  return await http.delete<any>(`${BASE}/${rolId}/${permisoId}`);
};

