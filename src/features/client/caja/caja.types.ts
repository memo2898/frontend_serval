export interface FormaPago {
  id: number;
  nombre: string;
  icono: string;
}

export interface PagoAplicado {
  forma_pago_id: number;
  nombre: string;
  icono: string;
  monto: number;
  cuenta_num: number;
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
  modificadores: Array<{ id: number; nombre_modificador: string; precio_extra: number }>;
}

export interface OrdenCobro {
  id: number;
  numero: string;
  mesa_id: number;
  estado: string;
  subtotal: number;
  impuestos: number;
  propina: number;
  total: number;
  notas: string;
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
  timestamp: number;
}

export interface TotalesCuenta {
  subtotal: number;
  impuestos: number;
  propina: number;
  total: number;
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
  // Cobro
  formasPago: FormaPago[];
  formaSeleccionada: FormaPago | null;
  pagos: PagoAplicado[];
  cuentaActivaCobro: number;
  cuentasCobradas: Set<number>;
}
