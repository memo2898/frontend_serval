// ─── Catálogo ────────────────────────────────────────────────────────────────

export interface Zona {
  id: number;
  nombre: string;
  orden_visual: number;
  sucursal_id: number;
}

export type EstadoMesa =
  | 'libre' | 'ocupada' | 'por_cobrar' | 'reservada' | 'bloqueada';

export interface Mesa {
  id: number;
  nombre: string;
  estado: EstadoMesa;
  zona_id: number;
  capacidad: number;
  posicion_x: number;
  posicion_y: number;
  mesa_principal_id?: number;
  // Campo computado por el backend desde la orden activa
  personas?: number;
}

export interface Familia {
  id: number;
  nombre: string;
  color: string;
  icono?: string;
}

export interface ImpuestoSucursal {
  impuesto_id: number;
  obligatorio: boolean;
  orden_aplicacion: number;
  impuesto: {
    id: number;
    nombre: string;
    porcentaje: string;
    tipo: 'general' | 'especifico';
    tipo_aplicacion: string;
  };
}

export interface Articulo {
  id: number;
  nombre: string;
  // En BD: precio_venta — el servicio lo mapea a este campo
  precio_venta: number;
  imagen?: string;
  familia_id: number;
  subfamilia_id?: number;
  descripcion?: string;
  tiempo_preparacion?: number;
  // Computado por el backend: true si tiene grupos_modificadores asociados
  tiene_mods: boolean;
}

export interface OpcionModificador {
  id: number;
  nombre: string;
  precio_extra: number;
}

export interface GrupoModificador {
  id: number;
  nombre: string;
  tipo: 'articulo' | 'comentario';
  seleccion: 'unica' | 'multiple';
  obligatorio: boolean;
  min_seleccion: number;
  max_seleccion: number;
  // En BD: tabla `modificadores` con grupo_modificador_id
  opciones: OpcionModificador[];
}

// ─── Orden ───────────────────────────────────────────────────────────────────

export type EstadoOrden =
  | 'abierta' | 'en_preparacion' | 'lista' | 'cobrada' | 'cancelada' | 'anulada';

export interface Orden {
  id: number;
  // En BD: numero_orden (INT) — convertido a string con padding
  numero_orden: number;
  mesa_id: number;
  sucursal_id: number;
  usuario_id?: number;
  cliente_id?: number;
  turno_id?: number;
  tipo_servicio: 'mesa' | 'barra' | 'take_away' | 'delivery';
  estado: EstadoOrden;
  descuento_total: number;
  subtotal: number;
  impuestos_total: number;
  total: number;
  notas?: string;
  fecha_apertura?: string;
}

export type EstadoLinea =
  | 'pendiente' | 'en_preparacion' | 'lista' | 'entregada' | 'cancelada';

export interface ModificadorLinea {
  id: number;
  modificador_id: number;
  nombre_modificador: string;
  precio_extra: number;
}

export interface LineaOrden {
  id: number;
  orden_id: number;
  articulo_id: number;
  nombre_articulo: string;
  cantidad: number;
  precio_unitario: number;
  descuento_linea: number;
  impuesto_linea: number;
  subtotal_linea: number;
  estado: EstadoLinea;
  enviado_a_cocina: boolean;
  cuenta_num: number;
  notas_linea?: string;
  modificadores: ModificadorLinea[];
  articulo?: { id: number; nombre: string; precio_venta: string | number };
}

// ─── Payloads WebSocket ───────────────────────────────────────────────────────

export interface PresenciaUsuario {
  usuario_id: number;
  nombre: string;
  rol: string;
}

export interface MesaPresenciaPayload {
  mesa_id: number;
  usuarios: PresenciaUsuario[];
}

export interface MesaPresenciaInicialPayload {
  presencias: MesaPresenciaPayload[];
}

export interface MesaPresenciaEventPayload {
  mesa_id: number;
  usuario_id: number;
  nombre: string;
  rol: string;
  timestamp: string;
}

export interface MesaEstadoCambioPayload {
  mesa_id: number;
  estado: EstadoMesa;
  personas?: number;
  mesa_principal_id?: number;
}

export interface KdsNuevaLineaPayload {
  orden_linea_id: number;
  orden_id: number;
  mesa_nombre: string;
  articulo_nombre: string;
  cantidad: number;
  notas_linea?: string;
  modificadores: Array<{ nombre: string; precio_extra: number }>;
  destino_id: number;
}

export interface KdsOrdenCompletaPayload {
  orden_id: number;
  mesa_id?: number;
  mesa_nombre?: string;
}

export interface OrdenLineasConfirmadasPayload {
  orden_id: number;
  lineas_enviadas: number[];
  destinos: { cocina: number[]; barra: number[] };
}

export interface OrdenLineaSincronizadaPayload {
  orden_id: number;
  mesa_id: number;
  accion: 'add' | 'update' | 'delete';
  linea: LineaOrden;
}

export interface CajaOrdenListaCobrarPayload {
  orden_id: number;
  mesa_id: number;
  mesa_nombre: string;
  total: number;
}

export interface CajaPagoRegistradoPayload {
  orden_id: number;
  mesa_id: number;
  forma_pago: string;
  monto: number;
  total_orden: number;
}

export interface CajaTurnoPayload {
  turno_id: number;
  terminal_id: number;
  usuario_id: number;
  monto_apertura?: number;
}

export interface CajaOrdenAnuladaPayload {
  orden_id: number;
  mesa_id: number;
  motivo?: string;
}

export interface ErrorEventoPayload {
  codigo: string;
  mensaje: string;
  detalle?: unknown;
}

// ─── Estado global de la página ──────────────────────────────────────────────

export interface MesasState {
  zonas: Zona[];
  mesas: Mesa[];
  zonaActiva: number | null;
  presencias: Record<number, PresenciaUsuario[]>;
  cargando: boolean;
  impuestos: ImpuestoSucursal[];

  // TPV
  ordenId: number | null;
  mesaId: number | null;
  mesaLabel: string;
  numComensales: number;
  orden: Orden | null;
  lineas: LineaOrden[];
  // IDs de líneas recién agregadas aún no persistidas en BD
  lineasNuevasIds: Set<number>;
  familias: Familia[];
  familiaActiva: number | null;
  articulos: Articulo[];
  lineaSeleccionada: LineaOrden | null;
  splitMode: boolean;
  numCuentas: number;

  // Estado KDS — habilita "pedir cuenta"
  ordenCompleta: boolean;

  // Merge
  mergeMode: boolean;
  mergePrincipal: Mesa | null;
  mergeSelected: number[];
  unirTPVSelected: number[];

  // Modal modificadores
  modalArticulo: Articulo | null;
  modalMods: Record<number, GrupoModificador>;
  modalSel: Record<number, Set<number>>;
}
