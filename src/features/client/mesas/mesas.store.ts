import type {
  MesasState, Mesa, Orden, LineaOrden,
  Articulo, GrupoModificador, OpcionModificador,
  Familia, Zona, ImpuestoSucursal,
  PresenciaUsuario, MesaPresenciaPayload,
} from './mesas.types';

// ─── Estado inicial ───────────────────────────────────────────────────────────

function createInitialState(): MesasState {
  return {
    zonas: [], mesas: [], zonaActiva: null,
    presencias: {},
    cargando: false,
    impuestos: [],
    ordenId: null, mesaId: null, mesaLabel: '',
    numComensales: 1,
    orden: null, lineas: [], lineasNuevasIds: new Set(),
    familias: [], familiaActiva: null, articulos: [],
    lineaSeleccionada: null,
    splitMode: false, numCuentas: 1, cuentasNombres: {},
    ordenCompleta: false,
    mergeMode: false, mergePrincipal: null, mergeSelected: [], unirTPVSelected: [],
    modalArticulo: null, modalMods: {}, modalSel: {},
  };
}

// ─── Persistencia de nombres de cuenta ───────────────────────────────────────

const CUENTAS_NOMBRES_PREFIX = 'serval_cuentas_';

function loadCuentasNombres(ordenId: number): Record<number, string> {
  try {
    const raw = localStorage.getItem(CUENTAS_NOMBRES_PREFIX + ordenId);
    return raw ? (JSON.parse(raw) as Record<number, string>) : {};
  } catch { return {}; }
}

function saveCuentasNombres(ordenId: number, nombres: Record<number, string>): void {
  try {
    if (Object.keys(nombres).length === 0) {
      localStorage.removeItem(CUENTAS_NOMBRES_PREFIX + ordenId);
    } else {
      localStorage.setItem(CUENTAS_NOMBRES_PREFIX + ordenId, JSON.stringify(nombres));
    }
  } catch { /* ignorar */ }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export class MesasStore {
  private _state: MesasState = createInitialState();
  private _listeners: Array<() => void> = [];
  private _nextTempId = -1; // IDs temporales negativos hasta ser persistidos

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

  /** ID temporal negativo para líneas aún no guardadas en BD. */
  nextTempId(): number { return this._nextTempId--; }

  getMesa(id: number): Mesa | undefined {
    return this._state.mesas.find(m => m.id === id);
  }

  // ─── Carga ───────────────────────────────────────────────────────────────────

  setCargando(v: boolean): void { this._state.cargando = v; this._notify(); }

  // ─── Catálogo ────────────────────────────────────────────────────────────────

  setZonas(zonas: Zona[]): void                   { this._state.zonas = zonas; this._notify(); }
  setMesas(mesas: Mesa[]): void                   { this._state.mesas = mesas; this._notify(); }
  setFamilias(f: Familia[]): void                 { this._state.familias = f; this._notify(); }
  setArticulos(a: Articulo[]): void               { this._state.articulos = a; this._notify(); }
  setImpuestos(i: ImpuestoSucursal[]): void       { this._state.impuestos = i; this._recalcular(); this._notify(); }

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

  // ─── Presencias ──────────────────────────────────────────────────────────────

  setPresencias(list: MesaPresenciaPayload[]): void {
    this._state.presencias = {};
    for (const { mesa_id, usuarios } of list) {
      this._state.presencias[mesa_id] = usuarios;
    }
    this._notify();
  }

  addPresencia(mesa_id: number, usuario: PresenciaUsuario): void {
    const arr = this._state.presencias[mesa_id] ?? [];
    if (!arr.some(u => u.usuario_id === usuario.usuario_id)) {
      this._state.presencias[mesa_id] = [...arr, usuario];
      this._notify();
    }
  }

  removePresencia(mesa_id: number, usuario_id: number): void {
    const arr = this._state.presencias[mesa_id];
    if (!arr) return;
    this._state.presencias[mesa_id] = arr.filter(u => u.usuario_id !== usuario_id);
    this._notify();
  }

  getPresencias(mesa_id: number): PresenciaUsuario[] {
    return this._state.presencias[mesa_id] ?? [];
  }

  // ─── Sesión TPV ──────────────────────────────────────────────────────────────

  openTPV(mesaId: number, mesaLabel: string, numComensales: number, orden: Orden): void {
    this._state.ordenId            = orden.id;
    this._state.mesaId             = mesaId;
    this._state.mesaLabel          = mesaLabel;
    this._state.numComensales      = numComensales;
    this._state.orden              = { ...orden };
    this._state.lineas             = [];
    this._state.lineasNuevasIds    = new Set();
    this._state.lineaSeleccionada  = null;
    this._state.splitMode          = false;
    this._state.numCuentas         = 1;
    this._state.cuentasNombres     = loadCuentasNombres(orden.id);
    this._state.ordenCompleta      = false;
    this._notify();
  }

  setLineas(lineas: LineaOrden[]): void {
    this._state.lineas = lineas;
    this._state.lineasNuevasIds = new Set();
    // Para órdenes cargadas: si todo ya fue enviado a KDS, habilitamos pedir cuenta
    // (no podemos saber el estado KDS exacto sin API, esto es una aproximación conservadora)
    this._state.ordenCompleta = lineas.length > 0 && lineas.every(l => l.enviado_a_cocina);
    this._recalcular();
    this._notify();
  }

  setOrdenCompleta(v: boolean): void {
    this._state.ordenCompleta = v;
    this._notify();
  }

  /** Recibe una línea enviada por otro camarero vía socket y la refleja localmente. */
  sincronizarLineaExterna(linea: LineaOrden): void {
    const idx = this._state.lineas.findIndex(l => l.id === linea.id);
    const existing = idx >= 0 ? this._state.lineas[idx] : undefined;
    const merged: LineaOrden = {
      ...linea,
      nombre_articulo: linea.nombre_articulo || existing?.nombre_articulo || '',
      modificadores:   linea.modificadores ?? existing?.modificadores ?? [],
    };
    if (idx >= 0) {
      this._state.lineas[idx] = merged;
    } else {
      this._state.lineas.push(merged);
    }
    this._recalcular();
    this._notify();
  }

  setNumComensales(n: number): void {
    this._state.numComensales = n;
    this._notify();
  }

  // ─── Líneas de orden ─────────────────────────────────────────────────────────

  /** Devuelve el ID temporal asignado a la nueva línea (negativo). */
  agregarLinea(art: Articulo, mods: OpcionModificador[]): number {
    const precioExtra = mods.reduce((s, m) => s + Number(m.precio_extra), 0);
    const precio = Number(art.precio_venta) + precioExtra;

    // Agrupar si el artículo y sus modificadores son idénticos y la línea aún no fue enviada a cocina
    const modIds = mods.map(m => m.id).sort();
    const existente = this._state.lineas.find(l => {
      if (l.articulo_id !== art.id || l.enviado_a_cocina) return false;
      const lModIds = l.modificadores.map(m => m.modificador_id).sort();
      return lModIds.length === modIds.length && lModIds.every((id, i) => id === modIds[i]);
    });

    if (existente) {
      existente.cantidad += 1;
      existente.subtotal_linea = existente.cantidad * existente.precio_unitario;
      this._recalcular();
      this._notify();
      return existente.id;
    }

    const tempId = this.nextTempId();
    this._state.lineas.push({
      id: tempId,
      orden_id: this._state.ordenId ?? 0,
      articulo_id: art.id,
      nombre_articulo: art.nombre,
      cantidad: 1,
      precio_unitario: precio,
      descuento_linea: 0,
      impuesto_linea: 0,
      subtotal_linea: precio,
      estado: 'pendiente',
      enviado_a_cocina: false,
      cuenta_num: 1,
      modificadores: mods.map(m => ({
        id: this.nextTempId(),
        modificador_id: m.id,
        nombre_modificador: m.nombre,
        precio_extra: m.precio_extra,
      })),
    });
    this._state.lineasNuevasIds.add(tempId);
    this._recalcular();
    this._notify();
    return tempId;
  }

  /** Marca una línea persistida como pendiente de enviar a cocina. */
  marcarComoNueva(lineaId: number): void {
    this._state.lineasNuevasIds.add(lineaId);
  }

  /** Reemplaza el ID temporal de una línea por el ID real devuelto por la BD. */
  confirmarLineaPersistida(tempId: number, lineaReal: LineaOrden): void {
    const idx = this._state.lineas.findIndex(l => l.id === tempId);
    if (idx < 0) return;
    this._state.lineas[idx] = lineaReal;
    this._state.lineasNuevasIds.delete(tempId);
    // Mantener el ID real como "nuevo" hasta que sea enviado a cocina
    if (!lineaReal.enviado_a_cocina) {
      this._state.lineasNuevasIds.add(lineaReal.id);
    }
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

  marcarLineasListas(ids: number[]): void {
    const set = new Set(ids);
    this._state.lineas = this._state.lineas.map(l =>
      set.has(l.id) ? { ...l, estado: 'lista' as const } : l
    );
    this._notify();
  }

  marcarLineasEntregadas(ids: number[]): void {
    const set = new Set(ids);
    this._state.lineas = this._state.lineas.map(l =>
      set.has(l.id) ? { ...l, estado: 'entregada' as const } : l
    );
    this._notify();
  }

  eliminarLinea(lineaId: number): void {
    this._state.lineas = this._state.lineas.filter(l => l.id !== lineaId);
    this._state.lineasNuevasIds.delete(lineaId);
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
    const MAX = Math.max(this._state.numComensales, 1);
    const next = (linea.cuenta_num || 1) + 1;
    if (next > this._state.numCuentas && this._state.numCuentas < MAX) {
      this._state.numCuentas = next;
      linea.cuenta_num = next;
    } else {
      linea.cuenta_num = next > this._state.numCuentas ? 1 : next;
    }
    this._notify();
  }

  setCuentaNombre(num: number, nombre: string): void {
    if (nombre.trim()) {
      this._state.cuentasNombres[num] = nombre.trim();
    } else {
      delete this._state.cuentasNombres[num];
    }
    if (this._state.ordenId) {
      saveCuentasNombres(this._state.ordenId, this._state.cuentasNombres);
    }
    this._notify();
  }

  toggleSplit(): void {
    this._state.splitMode = !this._state.splitMode;
    if (!this._state.splitMode) {
      this._state.lineas.forEach(l => { l.cuenta_num = 1; });
      this._state.numCuentas = 1;
      this._state.cuentasNombres = {};
      if (this._state.ordenId) saveCuentasNombres(this._state.ordenId, {});
    }
    this._notify();
  }

  setNota(nota: string): void {
    if (this._state.orden) this._state.orden.notas = nota;
  }

  marcarEnviadas(): void {
    this._state.lineas
      .filter(l => l.estado === 'pendiente')
      .forEach(l => { l.estado = 'en_preparacion'; l.enviado_a_cocina = true; });
    this._state.lineasNuevasIds.clear();
    this._notify();
  }

  private _recalcular(): void {
    const subtotal = this._state.lineas.reduce((s, l) => s + Number(l.subtotal_linea), 0);
    const generales = this._state.impuestos.filter(i => i.impuesto != null);
    const impuestos = generales.reduce((s, i) => {
      return s + Math.round(subtotal * (Number(i.impuesto.porcentaje) / 100) * 100) / 100;
    }, 0);
    const total = subtotal + impuestos;
    if (this._state.orden) {
      Object.assign(this._state.orden, { subtotal, impuestos_total: impuestos, total });
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
    this._state.ordenId          = null;
    this._state.mesaId           = null;
    this._state.mesaLabel        = '';
    this._state.orden            = null;
    this._state.lineas           = [];
    this._state.lineasNuevasIds  = new Set();
    if (this._state.ordenId) saveCuentasNombres(this._state.ordenId, {});
    this._state.lineaSeleccionada = null;
    this._state.splitMode        = false;
    this._state.numCuentas       = 1;
    this._state.cuentasNombres   = {};
    this._state.ordenCompleta    = false;
    this._notify();
  }
}
