export interface FormaPago {
  id: number;
  nombre: string;
  tipo: string;
  icono?: string;
}

export interface PagoAplicado {
  forma_pago_id: number;
  nombre: string;
  icono: string;
  monto: number;
  cuenta_num: number;
  referencia?: string;
}

export interface LineaCobro {
  id: number;
  orden_id: number;
  articulo_id: number;
  nombre_articulo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  estado: string;
  cuenta_num: number;
  modificadores: Array<{ id: number; modificador_id: number; nombre_modificador: string; precio_extra: number }>;
}

export interface OrdenCobro {
  id: number;
  numero_orden: number;
  mesa_id: number;
  estado: string;
  subtotal: number;
  impuestos_total: number;
  total: number;
  notas?: string;
}

export interface TicketCola {
  id: number;
  mesaId: number;
  mesaLabel: string;
  numComensales: number;
  orden: OrdenCobro;
  lineas: LineaCobro[];
  splitMode: boolean;
  numCuentas: number;
  cuentasNombres?: Record<number, string>;
  timestamp: number;
  pagosEnProceso?: PagoAplicado[];
  cuentasCobradas?: number[];
}

export interface TotalesCuenta {
  subtotal: number;
  impuestos: number;
  total: number;
  desglose: Array<{ nombre: string; porcentaje: number; monto: number }>;
}

export interface ImpuestoCaja {
  nombre: string;
  porcentaje: number;
}

export interface CajaState {
  queue: TicketCola[];
  // Ticket activo
  ticketId: number | null;
  mesaId: number | null;
  mesaLabel: string;
  orden: OrdenCobro | null;
  lineas: LineaCobro[];
  numComensales: number;
  splitMode: boolean;
  numCuentas: number;
  cuentasNombres: Record<number, string>;
  // Impuestos
  impuestos: ImpuestoCaja[];
  // Cobro
  formasPago: FormaPago[];
  formaSeleccionada: FormaPago | null;
  pagos: PagoAplicado[];
  cuentaActivaCobro: number;
  cuentasCobradas: Set<number>;
}
