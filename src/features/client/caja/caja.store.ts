import type {
  CajaState, TicketCola, FormaPago, PagoAplicado, TotalesCuenta,
} from './caja.types';

const FORMAS_PAGO_DEFAULT: FormaPago[] = [
  { id: 1, nombre: 'Efectivo',      icono: '💵' },
  { id: 2, nombre: 'Tarjeta',       icono: '💳' },
  { id: 3, nombre: 'Transferencia', icono: '📱' },
  { id: 4, nombre: 'Otro',          icono: '🔖' },
];

function createInitialState(): CajaState {
  return {
    queue: [],
    ticketId: null, mesaId: null, mesaLabel: '',
    orden: null, lineas: [],
    numComensales: 1, splitMode: false, numCuentas: 1,
    formasPago: [...FORMAS_PAGO_DEFAULT],
    formaSeleccionada: null,
    pagos: [],
    cuentaActivaCobro: 1,
    cuentasCobradas: new Set(),
  };
}

export class CajaStore {
  private _state: CajaState = createInitialState();
  private _listeners: Array<() => void> = [];

  subscribe(fn: () => void): () => void {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  private _notify(): void { this._listeners.forEach(fn => fn()); }

  get state(): Readonly<CajaState> { return this._state; }

  // ─── Cola ────────────────────────────────────────────────────────────────────

  setQueue(queue: TicketCola[]): void {
    this._state.queue = queue;
    this._notify();
  }

  // ─── Selección de ticket ──────────────────────────────────────────────────────

  selectTicket(ticket: TicketCola): void {
    this._state.ticketId        = ticket.id;
    this._state.mesaId          = ticket.mesaId;
    this._state.mesaLabel       = ticket.mesaLabel;
    this._state.orden           = { ...ticket.orden };
    this._state.lineas          = ticket.lineas.map(l => ({ ...l }));
    this._state.numComensales   = ticket.numComensales || 1;
    this._state.splitMode       = ticket.splitMode || false;
    this._state.numCuentas      = ticket.numCuentas || 1;
    this._state.formaSeleccionada = null;
    this._state.pagos           = [];
    this._state.cuentaActivaCobro = 1;
    this._state.cuentasCobradas   = new Set();
    this._notify();
  }

  // ─── Formas de pago ──────────────────────────────────────────────────────────

  selectForma(id: number): void {
    this._state.formaSeleccionada = this._state.formasPago.find(f => f.id === id) ?? null;
    this._notify();
  }

  agregarPago(monto: number): boolean {
    const forma = this._state.formaSeleccionada;
    if (!forma) return false;
    this._state.pagos.push({
      forma_pago_id: forma.id,
      nombre: forma.nombre,
      icono: forma.icono,
      monto,
      cuenta_num: this._state.cuentaActivaCobro,
    });
    this._notify();
    return true;
  }

  // ─── Split ───────────────────────────────────────────────────────────────────

  selectCuenta(n: number): void {
    this._state.cuentaActivaCobro = n;
    this._notify();
  }

  confirmarCuentaActiva(): 'siguiente' | 'fin' {
    this._state.cuentasCobradas.add(this._state.cuentaActivaCobro);
    const siguiente = Array.from({ length: this._state.numCuentas }, (_, i) => i + 1)
      .find(n => !this._state.cuentasCobradas.has(n));
    if (siguiente) {
      this.selectCuenta(siguiente);
      return 'siguiente';
    }
    return 'fin';
  }

  // ─── Totales ─────────────────────────────────────────────────────────────────

  getTotalCuenta(n: number): TotalesCuenta {
    const sub = this._state.lineas
      .filter(l => (l.cuenta_num || 1) === n)
      .reduce((s, l) => s + Number(l.subtotal_linea), 0);
    return {
      subtotal:   sub,
      impuestos:  Math.round(sub * 0.18),
      propina:    Math.round(sub * 0.10),
      total:      Math.round(sub * 1.28),
    };
  }

  getTotalActivo(): number {
    if (this._state.splitMode) return this.getTotalCuenta(this._state.cuentaActivaCobro).total;
    return this._state.orden?.total ?? 0;
  }

  getPagosActivos(): PagoAplicado[] {
    return this._state.splitMode
      ? this._state.pagos.filter(p => p.cuenta_num === this._state.cuentaActivaCobro)
      : this._state.pagos;
  }

  getTotalPagado(): number {
    return this.getPagosActivos().reduce((s, p) => s + p.monto, 0);
  }

  getPendiente(): number { return Math.max(0, this.getTotalActivo() - this.getTotalPagado()); }
  getCambio():    number { return Math.max(0, this.getTotalPagado() - this.getTotalActivo()); }

  // ─── Reset ───────────────────────────────────────────────────────────────────

  resetTicket(): void {
    this._state.ticketId = null; this._state.mesaId = null; this._state.mesaLabel = '';
    this._state.orden = null; this._state.lineas = [];
    this._state.splitMode = false; this._state.numCuentas = 1;
    this._state.formaSeleccionada = null; this._state.pagos = [];
    this._state.cuentaActivaCobro = 1; this._state.cuentasCobradas = new Set();
    this._notify();
  }
}
