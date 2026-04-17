import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type {
  Zona, Mesa, Familia, Articulo,
  GrupoModificador, Orden, LineaOrden,
} from './mesas.types';

const BASE = `${SERVER_ROUTE}/api`;

// ─── Catálogo ────────────────────────────────────────────────────────────────

export const getZonas     = () => http.get<Zona[]>(`${BASE}/zonas`);
export const getMesas     = () => http.get<Mesa[]>(`${BASE}/mesas`);
export const getFamilias  = () => http.get<Familia[]>(`${BASE}/familias`);
export const getArticulos = (familiaId: number) =>
  http.get<Articulo[]>(`${BASE}/articulos?familia_id=${familiaId}`);
export const getModificadores = (articuloId: number) =>
  http.get<GrupoModificador[]>(`${BASE}/articulos/${articuloId}/modificadores`);

// ─── Mesas ───────────────────────────────────────────────────────────────────

export const patchEstadoMesa = (mesaId: number, estado: string) =>
  http.patch(`${BASE}/mesas/${mesaId}`, { estado });

// ─── Órdenes ─────────────────────────────────────────────────────────────────

export const getOrden  = (ordenId: number) => http.get<Orden>(`${BASE}/ordenes/${ordenId}`);
export const createOrden = (data: Partial<Orden>) => http.post<Orden>(`${BASE}/ordenes`, data);
export const updateOrden = (id: number, data: Partial<Orden>) => http.patch<Orden>(`${BASE}/ordenes/${id}`, data);

export const getLineas  = (ordenId: number) => http.get<LineaOrden[]>(`${BASE}/ordenes/${ordenId}/lineas`);
export const createLinea = (ordenId: number, data: Partial<LineaOrden>) =>
  http.post<LineaOrden>(`${BASE}/ordenes/${ordenId}/lineas`, data);
export const updateLinea = (ordenId: number, lineaId: number, data: Partial<LineaOrden>) =>
  http.patch<LineaOrden>(`${BASE}/ordenes/${ordenId}/lineas/${lineaId}`, data);
export const deleteLinea = (ordenId: number, lineaId: number) =>
  http.delete(`${BASE}/ordenes/${ordenId}/lineas/${lineaId}`);

export const enviarCocina = (ordenId: number) =>
  http.post(`${BASE}/ordenes/${ordenId}/enviar-cocina`, {});

export const pedirCuenta  = (ordenId: number) =>
  http.post(`${BASE}/ordenes/${ordenId}/pedir-cuenta`, {});
