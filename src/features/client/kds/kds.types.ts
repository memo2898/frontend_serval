export type EstadoComanda = 'pendiente' | 'en_preparacion' | 'listo';
export type TipoServicio  = 'mesa' | 'take_away' | 'barra' | 'delivery';

export interface LineaKds {
  kds_orden_id: number;
  orden_linea_id: number;
  nombre: string;
  qty: number;
  mods: string;
  nota: string;
  done: boolean;
}

export interface Comanda {
  /** kds_orden_id del primer registro del grupo */
  kds_orden_id: number;
  orden_id: number;
  numero: string;
  mesa: string;
  tipo: TipoServicio;
  estado: EstadoComanda;
  /** timestamp ms — cuando llegó la comanda */
  abierta: number;
  /** timestamp ms — cuando se inició la preparación */
  iniciado?: number;
  lineas: LineaKds[];
}

export interface KdsConfig {
  /** Texto del topbar, ej: "KDS — Barra" */
  titulo: string;
  /** Rol socket: 'cocina' | 'barra' */
  rol: 'cocina' | 'barra';
  /** Color accent CSS, ej: '#1a52cc' */
  accentColor: string;
  /** RGB del accent para rgba(), ej: '26,82,204' */
  accentRgb: string;
  /** Minutos para pasar a estado warn */
  timerWarnMins: number;
  /** Minutos para pasar a estado late */
  timerLateMins: number;
  /** Filtro activo por defecto, ej: 'barra' | 'todas' */
  filtroDefault: string;
  /** destino_id para el endpoint de API */
  destinoId: number;
  /** sucursal_id para el socket */
  sucursalId: number;
  /** Ícono del empty state */
  emptyIcon: string;
  /** Texto del empty state */
  emptyText: string;
  /** Intervalo de polling en ms (0 = solo socket, sin polling) */
  pollIntervalMs?: number;
}
