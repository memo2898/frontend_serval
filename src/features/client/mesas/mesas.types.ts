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

export interface Familia {
  id: number;
  nombre: string;
  color: string;
}

export interface Articulo {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  familia_id: number;
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
  seleccion: 'unica' | 'multiple';
  obligatorio: boolean;
  opciones: OpcionModificador[];
}

// ─── Orden ───────────────────────────────────────────────────────────────────

export interface Orden {
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

export interface ModificadorLinea {
  id: number;
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
  subtotal_linea: number;
  estado: string;
  cuenta_num: number;
  modificadores: ModificadorLinea[];
}

// ─── Estado global de la página ──────────────────────────────────────────────

export interface MesasState {
  zonas: Zona[];
  mesas: Mesa[];
  zonaActiva: number | null;

  // TPV
  ordenId: number | null;
  mesaId: number | null;
  mesaLabel: string;
  numComensales: number;
  orden: Orden | null;
  lineas: LineaOrden[];
  familias: Familia[];
  familiaActiva: number | null;
  articulos: Articulo[];
  lineaSeleccionada: LineaOrden | null;
  splitMode: boolean;
  numCuentas: number;

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
