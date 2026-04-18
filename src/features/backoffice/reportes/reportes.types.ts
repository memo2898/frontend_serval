export interface ReporteVentasFiltros {
  fecha_inicio: string;
  fecha_fin: string;
  sucursal_id: number;
}

export interface ImpuestoDetalle {
  impuesto_id: number;
  nombre: string;
  porcentaje: number;
  monto: number;
}

export interface FormaPagoDetalle {
  forma_pago_id: number;
  forma_pago: string;
  total: number;
  cantidad_transacciones: number;
}

export interface ResumenVentas {
  total_ordenes: number;
  subtotal: number;
  impuestos: number;
  total_ventas: number;
}

export interface ReporteVentas {
  periodo: { fecha_inicio: string; fecha_fin: string };
  sucursal_id: number;
  resumen: ResumenVentas;
  impuestos_detalle: ImpuestoDetalle[];
  por_forma_pago: FormaPagoDetalle[];
}
