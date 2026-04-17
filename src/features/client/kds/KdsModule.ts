import { tiempoStr } from '../shared/utils/format';
import { toast } from '../shared/utils/toast';
import { doLogout } from '@/global/logOut';
import type { Comanda, EstadoComanda, KdsConfig, TipoServicio } from './kds.types';

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
  private _filtroActivo: string;
  private _tickTimer: ReturnType<typeof setInterval> | null = null;
  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: KdsConfig) {
    this._config = config;
    this._filtroActivo = config.filtroDefault;
  }

  // ─── Mount ──────────────────────────────────────────────────────────────────

  mount(): void {
    this._applyTheme();
    this._buildTopbar();
    this._buildFiltros();
    this._render();
    this._tick();
    this._tickTimer = setInterval(() => this._tick(), 1000);

    const pollMs = this._config.pollIntervalMs ?? 8000;
    this._pollTimer = setInterval(() => this._fetchComandas(), pollMs);
    this._fetchComandas();
  }

  destroy(): void {
    if (this._tickTimer)  clearInterval(this._tickTimer);
    if (this._pollTimer)  clearInterval(this._pollTimer);
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
      <span class="topbar-brand">ServalPOS</span>
      <span class="topbar-sep">|</span>
      <span class="topbar-title">${this._config.titulo}</span>
      <div class="topbar-spacer"></div>
      <span class="topbar-stat stat-pend" id="s-pend">0 pendientes</span>
      <span class="topbar-stat stat-prep" id="s-prep">0 en preparación</span>
      <span class="topbar-stat stat-list" id="s-list">0 listos</span>
      <span class="topbar-clock" id="reloj">00:00:00</span>
      <button class="btn-exit" id="kds-btn-exit">Salir</button>
    `;
    document.getElementById('kds-btn-exit')?.addEventListener('click', () => doLogout());
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

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  private async _fetchComandas(): Promise<void> {
    try {
      const { fetchComandas } = await import('./kds.service');
      this._comandas = await fetchComandas(this._config);
      this._render();
    } catch {
      // Silencioso en producción; en dev se puede loggear
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

  private _cambiarEstado(id: string): void {
    const c = this._comandas.find(x => x.id === id);
    if (!c) return;
    const next: Record<EstadoComanda, EstadoComanda | null> = {
      pendiente:      'en_preparacion',
      en_preparacion: 'listo',
      listo:          null,
    };
    const nuevoEstado = next[c.estado];
    if (nuevoEstado) {
      c.estado = nuevoEstado;
      const label = nuevoEstado === 'en_preparacion' ? 'en preparación' : 'lista ✓';
      toast(`Comanda ${c.numero} — ${label}`, 'info');
    } else {
      this._comandas = this._comandas.filter(x => x.id !== id);
      toast(`Comanda ${c.numero} entregada`, 'success');
    }
    this._render();
    // Fire-and-forget al backend
    import('./kds.service').then(({ patchEstadoComanda }) => {
      patchEstadoComanda(id, nuevoEstado ?? 'entregada').catch(() => { /* ignorar */ });
    });
  }

  private _toggleLinea(cmdId: string, lineaId: number): void {
    const c = this._comandas.find(x => x.id === cmdId);
    if (!c) return;
    const l = c.lineas.find(x => x.id === lineaId);
    if (l) l.done = !l.done;
    this._render();
    import('./kds.service').then(({ patchEstadoLinea }) => {
      patchEstadoLinea(cmdId, lineaId, l?.done ?? false).catch(() => { /* ignorar */ });
    });
  }

  private _reimprimir(id: string): void {
    const c = this._comandas.find(x => x.id === id);
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
      const tc = this._timerClass(elapsed, c.estado);
      return `
        <div class="comanda estado-${c.estado}" data-id="${c.id}">
          <div class="comanda-header">
            <span class="comanda-num">${c.numero}</span>
            <span class="comanda-mesa">${c.tipo === 'mesa' ? 'Mesa ' + c.mesa : ''}</span>
            <span class="comanda-tipo tipo-${c.tipo}">${TIPO_LABEL[c.tipo]}</span>
            <div class="comanda-spacer"></div>
            <span class="timer ${tc}" data-abierta="${c.abierta}">${tiempoStr(elapsed)}</span>
          </div>
          <div class="comanda-lineas">
            ${c.lineas.map(l => `
              <div class="linea-kds">
                <div class="linea-check ${l.done ? 'checked' : ''}" data-cmd="${c.id}" data-linea="${l.id}"></div>
                <div class="linea-info">
                  <div class="linea-nombre ${l.done ? 'done' : ''}">
                    <span class="linea-qty">${l.qty}x</span>${l.nombre}
                  </div>
                  ${l.mods ? `<div class="linea-mods">${l.mods}</div>` : ''}
                  ${l.nota ? `
                    <div class="linea-nota">
                      <span class="linea-nota-icon">!</span>${l.nota}
                    </div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="comanda-footer">
            <button class="btn-accion btn-reimprimir" data-reimprimir="${c.id}">⎙</button>
            <button class="btn-accion ${btnCls(c.estado)}" data-accion="${c.id}">${btnLabel(c.estado)}</button>
          </div>
        </div>
      `;
    }).join('');

    // Event delegation (evita inline onclick)
    grid.addEventListener('click', this._onGridClick, { once: true });
  }

  // ─── Event delegation ─────────────────────────────────────────────────────────

  private readonly _onGridClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;

    const accion = target.closest<HTMLElement>('[data-accion]');
    if (accion) { this._cambiarEstado(accion.dataset.accion!); return; }

    const reimp = target.closest<HTMLElement>('[data-reimprimir]');
    if (reimp) { this._reimprimir(reimp.dataset.reimprimir!); return; }

    const check = target.closest<HTMLElement>('[data-linea]');
    if (check) { this._toggleLinea(check.dataset.cmd!, Number(check.dataset.linea)); }
  };

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
    document.querySelectorAll<HTMLElement>('.timer[data-abierta]').forEach(el => {
      const elapsed = Date.now() - parseInt(el.dataset.abierta!);
      el.textContent = tiempoStr(elapsed);
      const cmdEl = el.closest<HTMLElement>('[data-id]');
      const cmd = cmdEl ? this._comandas.find(c => c.id === cmdEl.dataset.id) : undefined;
      el.className = 'timer ' + this._timerClass(elapsed, cmd?.estado ?? 'pendiente');
    });
  }

  // ─── Demo data (cargado si API falla) ────────────────────────────────────────

  loadDemoData(comandas: Comanda[]): void {
    this._comandas = comandas;
    this._render();
  }
}
