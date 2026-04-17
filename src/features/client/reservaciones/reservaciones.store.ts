import type {
  Zona, Mesa, Reservacion, ReservacionesState, EstadoMesa,
} from './reservaciones.types';

export class ReservacionesStore {
  private _state: ReservacionesState = {
    zonas: [],
    mesas: [],
    zonaActiva: null,
    reservaciones: [],
    mesaSeleccionada: null,
    reservacionSeleccionada: null,
    formPersonas: 2,
  };

  private _listeners: Array<() => void> = [];

  get state(): Readonly<ReservacionesState> { return this._state; }

  subscribe(fn: () => void): void { this._listeners.push(fn); }
  private _notify(): void { this._listeners.forEach(fn => fn()); }

  // ─── Setters de catálogo ──────────────────────────────────────────────────

  setZonas(zonas: Zona[]): void {
    this._state = { ...this._state, zonas };
    this._notify();
  }

  setMesas(mesas: Mesa[]): void {
    this._state = { ...this._state, mesas };
    this._notify();
  }

  setZonaActiva(zonaActiva: number): void {
    this._state = { ...this._state, zonaActiva };
    this._notify();
  }

  setReservaciones(reservaciones: Reservacion[]): void {
    this._state = { ...this._state, reservaciones };
    this._notify();
  }

  // ─── Setters de UI ────────────────────────────────────────────────────────

  setMesaSeleccionada(mesa: Mesa | null): void {
    this._state = { ...this._state, mesaSeleccionada: mesa };
  }

  setReservacionSeleccionada(res: Reservacion | null): void {
    this._state = { ...this._state, reservacionSeleccionada: res };
  }

  setFormPersonas(n: number): void {
    this._state = { ...this._state, formPersonas: n };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getMesa(id: number): Mesa | undefined {
    return this._state.mesas.find(m => m.id === id);
  }

  getReservacion(mesaId: number): Reservacion | undefined {
    return this._state.reservaciones.find(r => r.mesa_id === mesaId);
  }

  patchMesa(id: number, patch: Partial<Pick<Mesa, 'estado' | 'personas'>>): void {
    this._state = {
      ...this._state,
      mesas: this._state.mesas.map(m => m.id === id ? { ...m, ...patch } : m),
    };
    this._notify();
  }

  // ─── CRUD reservaciones ───────────────────────────────────────────────────

  addReservacion(reservacion: Reservacion): void {
    this._state = {
      ...this._state,
      reservaciones: [...this._state.reservaciones, reservacion],
    };
    this._notify();
  }

  updateReservacion(id: number, patch: Partial<Reservacion>): void {
    this._state = {
      ...this._state,
      reservaciones: this._state.reservaciones.map(r =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    };
    this._notify();
  }

  removeReservacion(id: number): void {
    this._state = {
      ...this._state,
      reservaciones: this._state.reservaciones.filter(r => r.id !== id),
    };
    this._notify();
  }

  nextId(): number { return Date.now(); }
}
