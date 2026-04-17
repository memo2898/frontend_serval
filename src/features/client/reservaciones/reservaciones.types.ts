// ─── Catálogo ────────────────────────────────────────────────────────────────

export interface Zona {
  id: number;
  nombre: string;
}

export type EstadoMesa =
  | 'libre' | 'ocupada' | 'por_cobrar' | 'reservada' | 'bloqueada';

export interface Mesa {
  id: number;
  nombre: string;
  estado: EstadoMesa;
  zona_id: number;
  capacidad: number;
  personas: number;
  posicion_x: number;
  posicion_y: number;
  mesa_principal_id?: number;
}

// ─── Reservación ─────────────────────────────────────────────────────────────

export interface Reservacion {
  id: number;
  mesa_id: number;
  nombre_cliente: string;
  telefono: string;
  /** Formato datetime-local: "YYYY-MM-DDTHH:mm" */
  fecha_hora: string;
  num_personas: number;
  notas: string;
  estado: 'pendiente' | 'confirmada';
}

// ─── Estado global de la página ──────────────────────────────────────────────

export interface ReservacionesState {
  zonas: Zona[];
  mesas: Mesa[];
  zonaActiva: number | null;
  reservaciones: Reservacion[];
  mesaSeleccionada: Mesa | null;
  reservacionSeleccionada: Reservacion | null;
  formPersonas: number;
}
