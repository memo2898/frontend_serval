import type {
  CajaState, TicketCola, FormaPago, PagoAplicado, TotalesCuenta, ImpuestoCaja,
} from './caja.types';

function createInitialState(): CajaState {
  return {
    queue: [],
    ticketId: null, mesaId: null, mesaLabel: '',
    orden: null, lineas: [],
    numComensales: 1, splitMode: false, numCuentas: 1,
    cuentasNombres: {},
    impuestos: [],
    formasPago: [],
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

  setImpuestos(impuestos: ImpuestoCaja[]): void {
    this._state.impuestos = impuestos;
    this._notify();
  }

  setFormasPago(formas: FormaPago[]): void {
    this._state.formasPago = formas;
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
    this._state.cuentasNombres  = { ...(ticket.cuentasNombres ?? {}) };
    this._state.formaSeleccionada = null;
    this._state.pagos           = [];
    this._state.cuentaActivaCobro = 1;
    this._state.cuentasCobradas   = new Set();
    this._notify();
  }

  setLineas(lineas: import('./caja.types').LineaCobro[]): void {
    this._state.lineas = lineas.map(l => ({ ...l }));
    // Recalcular subtotal de la orden activa desde las líneas reales
    if (this._state.orden) {
      this._state.orden = {
        ...this._state.orden,
        subtotal: Math.round(lineas.reduce((s, l) => s + Number(l.subtotal_linea), 0) * 100) / 100,
      };
    }
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
      icono: forma.icono ?? '',
      monto,
      cuenta_num: this._state.cuentaActivaCobro,
    });
    this._notify();
    return true;
  }

  eliminarPago(index: number): void {
    const activos = this.getPagosActivos();
    const pago    = activos[index];
    if (!pago) return;
    // Eliminar la primera ocurrencia que coincida exactamente
    const globalIdx = this._state.pagos.findIndex(
      p => p.forma_pago_id === pago.forma_pago_id && p.monto === pago.monto && p.cuenta_num === pago.cuenta_num
    );
    if (globalIdx >= 0) this._state.pagos.splice(globalIdx, 1);
    this._notify();
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

    const desglose = this._state.impuestos.map(i => ({
      nombre:     i.nombre,
      porcentaje: i.porcentaje,
      monto:      Math.round(sub * (i.porcentaje / 100) * 100) / 100,
    }));
    const impuestos = Math.round(desglose.reduce((s, d) => s + d.monto, 0) * 100) / 100;

    return {
      subtotal: sub,
      impuestos,
      desglose,
      total:    Math.round((sub + impuestos) * 100) / 100,
    };
  }

  getTotalActivo(): number {
    if (this._state.splitMode) return this.getTotalCuenta(this._state.cuentaActivaCobro).total;
    // Recalcular desde las tasas reales para no depender de orden.total (puede estar desactualizado)
    if (this._state.impuestos.length && this._state.orden) {
      const sub = this._state.orden.subtotal ?? 0;
      const imp = Math.round(
        this._state.impuestos.reduce((s, i) => s + Math.round(sub * (i.porcentaje / 100) * 100) / 100, 0)
        * 100
      ) / 100;
      return Math.round((sub + imp) * 100) / 100;
    }
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
    this._state.cuentasNombres = {};
    this._state.formaSeleccionada = null; this._state.pagos = [];
    this._state.cuentaActivaCobro = 1; this._state.cuentasCobradas = new Set();
    this._notify();
  }
}
