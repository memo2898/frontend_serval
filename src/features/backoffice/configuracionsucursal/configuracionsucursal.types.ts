import type { GridieCellAction } from '@/lib/gridie';

export interface ConfiguracionSucursal {
  id?: number;
  sucursal_id?: number;
  tiene_mesas?: boolean;
  tiene_delivery?: boolean;
  tiene_barra?: boolean;
  impuesto_defecto_id?: number;
  tarifa_defecto_id?: number;
  moneda?: string;
  formato_fecha?: string;
  zona_horaria?: string;
  permite_venta_sin_stock?: boolean;
  requiere_mesa_para_orden?: boolean;
  imprime_automatico_al_cerrar?: boolean;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface ConfiguracionSucursalGridRow {
  id?: number;
  sucursal_id?: number;
  tiene_mesas?: boolean;
  tiene_delivery?: boolean;
  tiene_barra?: boolean;
  impuesto_defecto_id?: number;
  tarifa_defecto_id?: number;
  moneda?: string;
  formato_fecha?: string;
  zona_horaria?: string;
  permite_venta_sin_stock?: boolean;
  requiere_mesa_para_orden?: boolean;
  imprime_automatico_al_cerrar?: boolean;
  actualizado_en?: string;
  actualizado_por?: number;
  actions: GridieCellAction[];
}

export interface ConfiguracionSucursalCreateDTO {
  sucursal_id: number;
  tiene_mesas: boolean;
  tiene_delivery: boolean;
  tiene_barra: boolean;
  impuesto_defecto_id: number;
  tarifa_defecto_id: number;
  moneda: string;
  formato_fecha: string;
  zona_horaria: string;
  permite_venta_sin_stock: boolean;
  requiere_mesa_para_orden: boolean;
  imprime_automatico_al_cerrar: boolean;
}

export interface ConfiguracionSucursalUpdateDTO {
  sucursal_id?: number;
  tiene_mesas?: boolean;
  tiene_delivery?: boolean;
  tiene_barra?: boolean;
  impuesto_defecto_id?: number;
  tarifa_defecto_id?: number;
  moneda?: string;
  formato_fecha?: string;
  zona_horaria?: string;
  permite_venta_sin_stock?: boolean;
  requiere_mesa_para_orden?: boolean;
  imprime_automatico_al_cerrar?: boolean;
}

export interface ConfiguracionSucursalFilters {
  page?: number;
  limit?: number;
  sort?: string;
  id?: number;
  sucursal_id?: number;
  tiene_mesas?: boolean;
  tiene_delivery?: boolean;
  tiene_barra?: boolean;
  impuesto_defecto_id?: number;
  tarifa_defecto_id?: number;
  moneda?: string;
  formato_fecha?: string;
  zona_horaria?: string;
  permite_venta_sin_stock?: boolean;
  requiere_mesa_para_orden?: boolean;
  imprime_automatico_al_cerrar?: boolean;
  actualizado_en?: string;
  actualizado_por?: number;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
