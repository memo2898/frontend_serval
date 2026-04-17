import type {
  MesasState, Mesa, Orden, LineaOrden,
  Articulo, GrupoModificador, OpcionModificador,
  Familia, Zona,
} from './mesas.types';

// ─── Estado inicial ───────────────────────────────────────────────────────────

function createInitialState(): MesasState {
  return {
    zonas: [], mesas: [], zonaActiva: null,
    ordenId: null, mesaId: null, mesaLabel: '',
    numComensales: 1,
    orden: null, lineas: [],
    familias: [], familiaActiva: null, articulos: [],
    lineaSeleccionada: null,
    splitMode: false, numCuentas: 1,
    mergeMode: false, mergePrincipal: null, mergeSelected: [], unirTPVSelected: [],
    modalArticulo: null, modalMods: {}, modalSel: {},
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export class MesasStore {
  private _state: MesasState = createInitialState();
  private _listeners: Array<() => void> = [];
  private _nextId = 1000;

  // ─── Suscripción ────────────────────────────────────────────────────────────

  subscribe(fn: () => void): () => void {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  private _notify(): void {
    this._listeners.forEach(fn => fn());
  }

  // ─── Lectura (inmutable) ─────────────────────────────────────────────────────

  get state(): Readonly<MesasState> { return this._state; }

  nextId(): number { return ++this._nextId; }

  getMesa(id: number): Mesa | undefined {
    return this._state.mesas.find(m => m.id === id);
  }

  // ─── Catálogo ────────────────────────────────────────────────────────────────

  setZonas(zonas: Zona[]): void      { this._state.zonas = zonas; this._notify(); }
  setMesas(mesas: Mesa[]): void      { this._state.mesas = mesas; this._notify(); }
  setFamilias(f: Familia[]): void    { this._state.familias = f; this._notify(); }
  setArticulos(a: Articulo[]): void  { this._state.articulos = a; this._notify(); }

  setZonaActiva(id: number): void {
    this._state.zonaActiva = id;
    this._notify();
  }

  setFamiliaActiva(id: number): void {
    this._state.familiaActiva = id;
    this._notify();
  }

  patchMesa(id: number, patch: Partial<Mesa>): void {
    const mesa = this._state.mesas.find(m => m.id === id);
    if (mesa) Object.assign(mesa, patch);
    this._notify();
  }

  // ─── Sesión TPV ──────────────────────────────────────────────────────────────

  openTPV(mesaId: number, mesaLabel: string, numComensales: number, orden: Orden): void {
    this._state.ordenId       = orden.id;
    this._state.mesaId        = mesaId;
    this._state.mesaLabel     = mesaLabel;
    this._state.numComensales = numComensales;
    this._state.orden         = { ...orden };
    this._state.lineas        = [];
    this._state.lineaSeleccionada = null;
    this._state.splitMode     = false;
    this._state.numCuentas    = 1;
    this._notify();
  }

  setLineas(lineas: LineaOrden[]): void {
    this._state.lineas = lineas;
    this._recalcular();
    this._notify();
  }

  setNumComensales(n: number): void {
    this._state.numComensales = n;
    this._notify();
  }

  // ─── Líneas de orden ─────────────────────────────────────────────────────────

  agregarLinea(art: Articulo, mods: OpcionModificador[]): void {
    const precioExtra = mods.reduce((s, m) => s + m.precio_extra, 0);
    const precio = art.precio + precioExtra;
    const existente = mods.length === 0
      ? this._state.lineas.find(l => l.articulo_id === art.id && l.modificadores.length === 0)
      : undefined;

    if (existente) {
      existente.cantidad += 1;
      existente.subtotal_linea = existente.cantidad * existente.precio_unitario;
    } else {
      this._state.lineas.push({
        id: this.nextId(),
        orden_id: this._state.ordenId ?? 0,
        articulo_id: art.id,
        nombre_articulo: art.nombre,
        cantidad: 1,
        precio_unitario: precio,
        subtotal_linea: precio,
        estado: 'pendiente',
        cuenta_num: 1,
        modificadores: mods.map(m => ({
          id: this.nextId(),
          nombre_modificador: m.nombre,
          precio_extra: m.precio_extra,
        })),
      });
    }
    this._recalcular();
    this._notify();
  }

  cambiarCantidad(lineaId: number, delta: number): void {
    const linea = this._state.lineas.find(l => l.id === lineaId);
    if (!linea) return;
    linea.cantidad = Math.max(1, linea.cantidad + delta);
    linea.subtotal_linea = linea.cantidad * linea.precio_unitario;
    this._recalcular();
    this._notify();
  }

  eliminarLinea(lineaId: number): void {
    this._state.lineas = this._state.lineas.filter(l => l.id !== lineaId);
    if (this._state.lineaSeleccionada?.id === lineaId) {
      this._state.lineaSeleccionada = null;
    }
    this._recalcular();
    this._notify();
  }

  selectLinea(lineaId: number): void {
    const linea = this._state.lineas.find(l => l.id === lineaId);
    this._state.lineaSeleccionada =
      this._state.lineaSeleccionada?.id === lineaId ? null : (linea ?? null);
    this._notify();
  }

  ciclarCuenta(lineaId: number): void {
    const linea = this._state.lineas.find(l => l.id === lineaId);
    if (!linea) return;
    const MAX = 6;
    const next = (linea.cuenta_num || 1) + 1;
    if (next > this._state.numCuentas && this._state.numCuentas < MAX) {
      this._state.numCuentas = next;
      linea.cuenta_num = next;
    } else {
      linea.cuenta_num = next > this._state.numCuentas ? 1 : next;
    }
    this._notify();
  }

  toggleSplit(): void {
    this._state.splitMode = !this._state.splitMode;
    if (!this._state.splitMode) {
      this._state.lineas.forEach(l => { l.cuenta_num = 1; });
      this._state.numCuentas = 1;
    }
    this._notify();
  }

  setNota(nota: string): void {
    if (this._state.orden) this._state.orden.notas = nota;
  }

  marcarEnviadas(): void {
    this._state.lineas
      .filter(l => l.estado === 'pendiente')
      .forEach(l => { l.estado = 'en_preparacion'; });
    this._notify();
  }

  private _recalcular(): void {
    const subtotal  = this._state.lineas.reduce((s, l) => s + l.subtotal_linea, 0);
    const impuestos = Math.round(subtotal * 0.18);
    const propina   = Math.round(subtotal * 0.10);
    const total     = subtotal + impuestos + propina;
    if (this._state.orden) {
      Object.assign(this._state.orden, { subtotal, impuestos, propina, total });
    }
  }

  // ─── Merge mesas ────────────────────────────────────────────────────────────

  initMerge(principal: Mesa): void {
    this._state.mergeMode      = true;
    this._state.mergePrincipal = principal;
    this._state.mergeSelected  = [];
    this._notify();
  }

  cancelMerge(): void {
    this._state.mergeMode      = false;
    this._state.mergePrincipal = null;
    this._state.mergeSelected  = [];
    this._notify();
  }

  toggleMergeSelect(mesaId: number): void {
    const idx = this._state.mergeSelected.indexOf(mesaId);
    if (idx >= 0) this._state.mergeSelected.splice(idx, 1);
    else this._state.mergeSelected.push(mesaId);
    this._notify();
  }

  confirmarMerge(): void {
    const principal = this._state.mergePrincipal;
    if (!principal) return;
    this._state.mergeSelected.forEach(id => {
      this.patchMesa(id, { estado: 'ocupada', mesa_principal_id: principal.id });
    });
    this.cancelMerge();
  }

  toggleUnirTPV(mesaId: number): void {
    const idx = this._state.unirTPVSelected.indexOf(mesaId);
    if (idx >= 0) this._state.unirTPVSelected.splice(idx, 1);
    else this._state.unirTPVSelected.push(mesaId);
    this._notify();
  }

  confirmarUnirTPV(): void {
    this._state.unirTPVSelected.forEach(id => {
      this.patchMesa(id, { estado: 'ocupada', mesa_principal_id: this._state.mesaId ?? undefined });
    });
    this._state.unirTPVSelected = [];
    this._notify();
  }

  clearUnirTPV(): void {
    this._state.unirTPVSelected = [];
    this._notify();
  }

  // ─── Modal modificadores ─────────────────────────────────────────────────────

  openModal(art: Articulo, grupos: GrupoModificador[]): void {
    this._state.modalArticulo = art;
    this._state.modalMods = {};
    grupos.forEach(g => { this._state.modalMods[g.id] = g; });
    this._state.modalSel = {};
    this._notify();
  }

  closeModal(): void {
    this._state.modalArticulo = null;
    this._state.modalSel = {};
    this._notify();
  }

  toggleMod(grupoId: number, opcionId: number, seleccion: 'unica' | 'multiple'): void {
    if (!this._state.modalSel[grupoId]) {
      this._state.modalSel[grupoId] = new Set<number>();
    }
    const sel = this._state.modalSel[grupoId];
    if (seleccion === 'unica') {
      sel.clear();
      sel.add(opcionId);
    } else {
      if (sel.has(opcionId)) sel.delete(opcionId);
      else sel.add(opcionId);
    }
    this._notify();
  }

  getSelectedMods(): OpcionModificador[] {
    const result: OpcionModificador[] = [];
    Object.entries(this._state.modalSel).forEach(([grupoId, opIds]) => {
      const grupo = this._state.modalMods[Number(grupoId)];
      if (!grupo) return;
      opIds.forEach(opId => {
        const op = grupo.opciones.find(o => o.id === opId);
        if (op) result.push(op);
      });
    });
    return result;
  }

  isModalValid(): boolean {
    return Object.values(this._state.modalMods)
      .filter(g => g.obligatorio)
      .every(g => (this._state.modalSel[g.id]?.size ?? 0) > 0);
  }

  // ─── Reset ───────────────────────────────────────────────────────────────────

  resetTPV(): void {
    this._state.ordenId   = null;
    this._state.mesaId    = null;
    this._state.mesaLabel = '';
    this._state.orden     = null;
    this._state.lineas    = [];
    this._state.lineaSeleccionada = null;
    this._state.splitMode = false;
    this._state.numCuentas = 1;
    this._notify();
  }
}
