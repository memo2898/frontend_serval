import { tiempoStr } from '../shared/utils/format';
import { toast } from '../shared/utils/toast';
import { doLogout } from '@/global/logOut';
import { posSocket } from '../shared/services/pos-socket';
import type { Comanda, EstadoComanda, KdsConfig, TipoServicio } from './kds.types';
import { MenuModal } from './menu-modal';

// ─── Labels helpers ───────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoServicio, string> = {
  mesa: 'Mesa', take_away: 'Take Away', barra: 'Barra', delivery: 'Delivery',
};

function btnLabel(estado: EstadoComanda): string {
  if (estado === 'pendiente')      return '▶ Iniciar preparación';
  if (estado === 'en_preparacion') return '✓ Marcar listo';
  return '↑ Entregar / Archivar';
}

function btnCls(estado: EstadoComanda): string {
  if (estado === 'pendiente')      return 'btn-iniciar';
  if (estado === 'en_preparacion') return 'btn-listo';
  return 'btn-entregar';
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class KdsModule {
  private readonly _config: KdsConfig;
  private _comandas: Comanda[] = [];
  private _despachadas = new Set<number>(); // kds_orden_ids marcados como listos localmente
  private _notaPopup: HTMLDivElement | null = null;
  private _filtroActivo: string;
  private _tickTimer: ReturnType<typeof setInterval> | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;
  private _menuModal: MenuModal | null = null;

  constructor(config: KdsConfig) {
    this._config = config;
    this._filtroActivo = config.filtroDefault;
  }

  // ─── Mount ──────────────────────────────────────────────────────────────────

  mount(): void {
    this._menuModal = new MenuModal(this._config.sucursalId);
    this._applyTheme();
    this._buildTopbar();
    this._buildFiltros();
    this._render();
    this._tick();
    this._tickTimer = setInterval(() => this._tick(), 1000);

    // Event delegation permanente — se registra una sola vez
    document.getElementById('kds-grid')?.addEventListener('click', this._onGridClick);

    // Polling como fallback (reducido cuando el socket está activo)
    const pollMs = this._config.pollIntervalMs ?? 8000;
    if (pollMs > 0) {
      this._pollTimer = setInterval(() => this._fetchComandas(), pollMs);
    }
    this._fetchComandas();
    this._connectSocket();
  }

  destroy(): void {
    if (this._tickTimer)  clearInterval(this._tickTimer);
    if (this._pollTimer)  clearInterval(this._pollTimer);
    posSocket.disconnect();
  }

  // ─── Tema (CSS custom properties) ───────────────────────────────────────────

  private _applyTheme(): void {
    document.documentElement.style.setProperty('--accent',     this._config.accentColor);
    document.documentElement.style.setProperty('--accent-rgb', this._config.accentRgb);
  }

  // ─── Construcción de estructura ──────────────────────────────────────────────

  private _buildTopbar(): void {
    const tb = document.getElementById('kds-topbar');
    if (!tb) return;
    tb.innerHTML = `
      <span class="topbar-brand">Serval</span>
      <span class="topbar-sep">|</span>
      <span class="topbar-title">${this._config.titulo}</span>
      <div class="topbar-spacer"></div>
      <span class="topbar-stat stat-pend" id="s-pend">0 pendientes</span>
      <span class="topbar-stat stat-prep" id="s-prep">0 en preparación</span>
      <span class="topbar-stat stat-list" id="s-list">0 listos</span>
      <span class="topbar-clock" id="reloj">00:00:00</span>
      <button class="btn-menu-kds" id="kds-btn-menu"><i class="fa-solid fa-book-open"></i> Menú</button>
      <button class="btn-exit" id="kds-btn-exit">Salir</button>
    `;
    document.getElementById('kds-btn-exit')?.addEventListener('click', () => doLogout());
    document.getElementById('kds-btn-menu')?.addEventListener('click', () => this._menuModal?.open());
  }

  private _buildFiltros(): void {
    const el = document.getElementById('kds-filtros');
    if (!el) return;
    const filtros = [
      { key: 'todas',          cls: 'f-all',     label: 'Todas' },
      { key: 'pendiente',      cls: 'f-pending',  label: 'Pendientes' },
      { key: 'en_preparacion', cls: 'f-prep',     label: 'En preparación' },
      { key: 'listo',          cls: 'f-ready',    label: 'Listos' },
      { key: 'mesa',           cls: 'f-tipo',     label: 'Mesa' },
      { key: 'take_away',      cls: 'f-tipo',     label: 'Take Away' },
      { key: 'barra',          cls: 'f-tipo',     label: 'Barra' },
      { key: 'delivery',       cls: 'f-tipo',     label: 'Delivery' },
    ];
    el.innerHTML = filtros.map(f => `
      <button class="filtro-btn ${f.cls} ${f.key === this._filtroActivo ? 'active' : ''}"
        data-filtro="${f.key}">${f.label}</button>
    `).join('');

    el.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-filtro]');
      if (!btn) return;
      el.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this._filtroActivo = btn.dataset.filtro!;
      this._render();
    });
  }

  // ─── Socket ──────────────────────────────────────────────────────────────────

  private _connectSocket(): void {
    import('@/global/session.service').then(({ getToken }) => {
      const tk = getToken();
      if (tk) posSocket.connect(tk, this._config.sucursalId, this._config.rol);
    });

    posSocket.onKdsNuevaLinea(payload => {
      // Cada envío a cocina es una tarjeta separada, aunque sea la misma mesa
      this._comandas.unshift({
        kds_orden_id: payload.kds_orden_id,
        orden_id:     payload.orden_id,
        numero:       '#' + String(payload.numero_orden).padStart(4, '0'),
        mesa:         payload.mesa,
        tipo:         payload.tipo_servicio as Comanda['tipo'],
        estado:       'pendiente',
        abierta:      new Date(payload.tiempo_recibido).getTime(),
        lineas:       payload.lineas.map(l => ({
          kds_orden_id:   l.kds_orden_id,
          orden_linea_id: l.orden_linea_id,
          nombre:         l.articulo,
          qty:            l.cantidad,
          mods:           Array.isArray(l.modificadores) ? l.modificadores.join(', ') : '',
          nota:           l.notas_linea ?? '',
          done:           false,
        })),
      });
      this._render();
      toast(`Nueva comanda: ${payload.mesa}`, 'info');
    });

    posSocket.onKdsOrdenCompleta(({ orden_id }) => {
      const c = this._comandas.find(x => x.orden_id === orden_id);
      if (c) { c.estado = 'listo'; this._render(); }
    });
  }

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  private async _fetchComandas(): Promise<void> {
    try {
      const { fetchComandas } = await import('./kds.service');
      const fromServer = await fetchComandas(this._config);

      const filtered = fromServer.filter(c =>
        !this._despachadas.has(c.kds_orden_id) &&
        !c.lineas.every(l => this._despachadas.has(l.kds_orden_id))
      );

      const localIds  = new Set(this._comandas.map(c => c.kds_orden_id));
      const serverIds = new Set(filtered.map(c => c.kds_orden_id));
      const hayNuevas = filtered.some(c => !localIds.has(c.kds_orden_id));
      // Solo cuenta como eliminada si no está en listo local (las listas se mantienen hasta despachar)
      const hayElim   = this._comandas.some(c =>
        !serverIds.has(c.kds_orden_id) &&
        !this._despachadas.has(c.kds_orden_id) &&
        c.estado !== 'listo'
      );

      if (!hayNuevas && !hayElim) return;

      // Cards marcadas listo localmente que el servidor ya no devuelve (están listas en DB)
      const listasLocales = this._comandas.filter(c =>
        c.estado === 'listo' &&
        !serverIds.has(c.kds_orden_id) &&
        !this._despachadas.has(c.kds_orden_id)
      );

      this._comandas = [
        ...filtered.map(serverComanda => {
          const local = this._comandas.find(l => l.kds_orden_id === serverComanda.kds_orden_id);
          if (!local) return serverComanda;
          return {
            ...serverComanda,
            estado:   local.estado,
            iniciado: local.iniciado,
            lineas: serverComanda.lineas.map(sl => {
              const ll = local.lineas.find(l => l.kds_orden_id === sl.kds_orden_id);
              return ll ? { ...sl, done: ll.done } : sl;
            }),
          };
        }),
        ...listasLocales,
      ];

      this._render();
    } catch {
      // Silencioso en producción
    }
  }

  // ─── Timer class ─────────────────────────────────────────────────────────────

  private _timerClass(ms: number, estado: EstadoComanda): string {
    if (estado === 'listo') return 'ok';
    const mins = ms / 60000;
    if (mins > this._config.timerLateMins) return 'late';
    if (mins > this._config.timerWarnMins) return 'warn';
    return 'ok';
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────────

  private _aplicarFiltro(c: Comanda): boolean {
    const f = this._filtroActivo;
    if (f === 'todas')          return true;
    if (f === 'pendiente')      return c.estado === 'pendiente';
    if (f === 'en_preparacion') return c.estado === 'en_preparacion';
    if (f === 'listo')          return c.estado === 'listo';
    return c.tipo === f;
  }

  // ─── Acciones ────────────────────────────────────────────────────────────────

  private _cambiarEstado(kdsOrdenId: number): void {
    const c = this._comandas.find(x => x.kds_orden_id === kdsOrdenId);
    if (!c) return;

    // Bloquear "marcar listo" si hay líneas sin check
    if (c.estado === 'en_preparacion' && c.lineas.some(l => !l.done)) {
      toast('Marca todas las líneas antes de marcar como listo', 'error');
      return;
    }

    const next: Record<EstadoComanda, EstadoComanda | null> = {
      pendiente:      'en_preparacion',
      en_preparacion: 'listo',
      listo:          null,
    };
    const nuevoEstado = next[c.estado];
    if (nuevoEstado) {
      c.estado = nuevoEstado;
      if (nuevoEstado === 'en_preparacion') {
        c.iniciado = Date.now();
        // Marcar todas las líneas en preparación
        c.lineas.forEach(l => posSocket.emitLineaEnPreparacion(l.kds_orden_id));
      } else {
        // Emitir todos los IDs del batch en un solo evento — sin race condition
        posSocket.emitBatchLista(c.lineas.map(l => l.kds_orden_id));
      }
      toast(`Comanda ${c.numero} — ${nuevoEstado === 'en_preparacion' ? 'en preparación' : 'lista ✓'}`, 'info');
    } else {
      // Registrar todos los IDs como despachados para que el polling no los reviva
      c.lineas.forEach(l => this._despachadas.add(l.kds_orden_id));
      this._despachadas.add(kdsOrdenId);
      this._comandas = this._comandas.filter(x => x.kds_orden_id !== kdsOrdenId);
      toast(`Comanda ${c.numero} entregada`, 'success');
    }
    this._render();
  }

  private _toggleLinea(cmdKdsId: number, lineaKdsId: number): void {
    const c = this._comandas.find(x => x.kds_orden_id === cmdKdsId);
    if (!c) return;
    const l = c.lineas.find(x => x.kds_orden_id === lineaKdsId);
    if (l) l.done = !l.done;
    this._render();
  }

  private _reimprimir(kdsOrdenId: number): void {
    const c = this._comandas.find(x => x.kds_orden_id === kdsOrdenId);
    if (c) toast(`Reimprimiendo ${c.numero}…`, 'info');
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  private _render(): void {
    const now = Date.now();
    const pend = this._comandas.filter(c => c.estado === 'pendiente').length;
    const prep = this._comandas.filter(c => c.estado === 'en_preparacion').length;
    const list = this._comandas.filter(c => c.estado === 'listo').length;

    document.getElementById('s-pend')!.textContent = pend + (pend === 1 ? ' pendiente' : ' pendientes');
    document.getElementById('s-prep')!.textContent = prep + ' en preparación';
    document.getElementById('s-list')!.textContent = list + (list === 1 ? ' listo' : ' listos');

    const vis   = this._comandas.filter(c => this._aplicarFiltro(c));
    const grid  = document.getElementById('kds-grid')!;

    if (!vis.length) {
      grid.innerHTML = `
        <div class="kds-empty">
          <div class="kds-empty-icon">${this._config.emptyIcon}</div>
          <div class="kds-empty-txt">${this._config.emptyText}</div>
        </div>`;
      return;
    }

    grid.innerHTML = vis.map(c => {
      const elapsed = now - c.abierta;
      const tc      = this._timerClass(elapsed, c.estado);
      const enPrep  = c.estado === 'en_preparacion';
      const prepMs  = enPrep && c.iniciado ? now - c.iniciado : 0;
      return `
        <div class="comanda estado-${c.estado}" data-kds="${c.kds_orden_id}">
          <div class="comanda-header">
            <span class="comanda-num">${c.numero}</span>
            <span class="comanda-mesa">${c.tipo === 'mesa' ? 'Mesa ' + c.mesa : ''}</span>
            <span class="comanda-tipo tipo-${c.tipo}">${TIPO_LABEL[c.tipo]}</span>
            <span class="comanda-count">${c.lineas.length} plato${c.lineas.length !== 1 ? 's' : ''}</span>
            <div class="comanda-spacer"></div>
            <span class="timer-wrap">
              <span class="timer-label">⏱</span>
              <span class="timer ${tc}" data-abierta="${c.abierta}">${tiempoStr(elapsed)}</span>
              ${enPrep ? `<span class="timer-label" style="margin-left:8px">🍳</span>
              <span class="timer timer-prep" data-iniciado="${c.iniciado ?? ''}">${tiempoStr(prepMs)}</span>` : ''}
            </span>
          </div>
          <div class="comanda-lineas-wrap">
            <div class="comanda-lineas">
              ${[...c.lineas].sort((a, b) => Number(a.done) - Number(b.done)).map(l => `
                <div class="linea-kds">
                  <div class="linea-check ${l.done ? 'checked' : ''} ${!enPrep ? 'disabled' : ''}"
                    data-cmd="${c.kds_orden_id}" data-linea="${l.kds_orden_id}"></div>
                  <div class="linea-info">
                    <div class="linea-nombre ${l.done ? 'done' : ''}">
                      <span class="linea-qty">${l.qty}x</span>${l.nombre}
                    </div>
                    ${l.mods ? `<div class="linea-mods">${l.mods}</div>` : ''}
                    ${l.nota ? `<button class="btn-nota-kds" data-nota-kds="${l.nota.replace(/"/g,'&quot;')}"><i class="fa-solid fa-comment-dots"></i> Nota</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="comanda-footer">
            <button class="btn-accion btn-reimprimir" data-reimprimir="${c.kds_orden_id}">⎙</button>
            <button class="btn-accion ${btnCls(c.estado)}${enPrep && c.lineas.some(l => !l.done) ? ' btn-disabled' : ''}"
              data-accion="${c.kds_orden_id}">${btnLabel(c.estado)}</button>
          </div>
        </div>
      `;
    }).join('');

    // Activar fade en wraps cuyo contenido desborda
    grid.querySelectorAll<HTMLElement>('.comanda-lineas-wrap').forEach(wrap => {
      const lineas = wrap.querySelector<HTMLElement>('.comanda-lineas');
      if (!lineas) return;
      const update = () => wrap.classList.toggle(
        'has-more',
        lineas.scrollHeight > lineas.clientHeight + 4 && lineas.scrollTop + lineas.clientHeight < lineas.scrollHeight - 4,
      );
      update();
      lineas.addEventListener('scroll', update, { passive: true });
    });

  }

  // ─── Event delegation ─────────────────────────────────────────────────────────

  private readonly _onGridClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;

    const accion = target.closest<HTMLElement>('[data-accion]');
    if (accion) { this._cambiarEstado(Number(accion.dataset.accion)); return; }

    const reimp = target.closest<HTMLElement>('[data-reimprimir]');
    if (reimp) { this._reimprimir(Number(reimp.dataset.reimprimir)); return; }

    const notaBtn = target.closest<HTMLElement>('[data-nota-kds]');
    if (notaBtn) { this._mostrarNotaPopup(notaBtn.dataset.notaKds ?? '', notaBtn); return; }

    const check = target.closest<HTMLElement>('[data-linea]');
    if (check && !check.classList.contains('disabled')) {
      this._toggleLinea(Number(check.dataset.cmd), Number(check.dataset.linea));
    }
  };

  // ─── Popup nota ──────────────────────────────────────────────────────────────

  private _mostrarNotaPopup(nota: string, anchor: HTMLElement): void {
    if (!this._notaPopup) {
      this._notaPopup = document.createElement('div');
      this._notaPopup.className = 'kds-nota-popup';
      this._notaPopup.style.display = 'none';
      document.body.appendChild(this._notaPopup);
      document.addEventListener('click', (e) => {
        if (this._notaPopup && !this._notaPopup.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-nota-kds]')) {
          this._notaPopup.style.display = 'none';
        }
      });
    }
    if (this._notaPopup.style.display === 'block') {
      this._notaPopup.style.display = 'none';
      return;
    }
    this._notaPopup.textContent = nota;
    this._notaPopup.style.display = 'block';
    const rect = anchor.getBoundingClientRect();
    const popW = 240;
    let left = rect.left;
    if (left + popW > window.innerWidth - 10) left = window.innerWidth - popW - 10;
    this._notaPopup.style.left = left + 'px';
    this._notaPopup.style.top = (rect.bottom + 6) + 'px';
  }

  // ─── Reloj + timers ───────────────────────────────────────────────────────────

  private _tick(): void {
    const now = new Date();
    const reloj = document.getElementById('reloj');
    if (reloj) {
      reloj.textContent =
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');
    }
    const nowMs = Date.now();
    document.querySelectorAll<HTMLElement>('.timer[data-abierta]').forEach(el => {
      const elapsed = nowMs - parseInt(el.dataset.abierta!);
      el.textContent = tiempoStr(elapsed);
      const cmdEl = el.closest<HTMLElement>('[data-kds]');
      const cmd = cmdEl ? this._comandas.find(c => c.kds_orden_id === Number(cmdEl.dataset.kds)) : undefined;
      el.className = 'timer ' + this._timerClass(elapsed, cmd?.estado ?? 'pendiente');
    });
    document.querySelectorAll<HTMLElement>('.timer-prep[data-iniciado]').forEach(el => {
      const ts = parseInt(el.dataset.iniciado!);
      if (!ts) return;
      el.textContent = tiempoStr(nowMs - ts);
    });
  }

  // ─── Demo data (cargado si API falla) ────────────────────────────────────────

  loadDemoData(comandas: Comanda[]): void {
    this._comandas = comandas;
    this._render();
  }
}
