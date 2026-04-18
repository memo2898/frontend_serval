import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { ReporteVentas, ReporteVentasFiltros } from './reportes.types';

const BASE = `${SERVER_ROUTE}/api`;

export const getReporteVentas = (filtros: ReporteVentasFiltros): Promise<ReporteVentas> => {
  const params = new URLSearchParams({
    fecha_inicio: filtros.fecha_inicio,
    fecha_fin: filtros.fecha_fin,
    sucursal_id: String(filtros.sucursal_id),
  });
  return http.get<ReporteVentas>(`${BASE}/reportes/ventas?${params}`);
};
