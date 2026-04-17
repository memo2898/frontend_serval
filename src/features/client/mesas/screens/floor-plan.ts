import { toast } from '../../shared/utils/toast';
import type { MesasStore } from '../mesas.store';
import type { Mesa } from '../mesas.types';


export class FloorPlanScreen {
  private readonly _store: MesasStore;
  private readonly _onOpenTPV: (mesaId: number) => void;
  private readonly _onAbrirAccionMesa: (mesa: Mesa) => void;

  constructor(
    store: MesasStore,
    onOpenTPV: (mesaId: number) => void,
    onAbrirAccionMesa: (mesa: Mesa) => void,
  ) {
    this._store = store;
    this._onOpenTPV = onOpenTPV;
    this._onAbrirAccionMesa = onAbrirAccionMesa;
  }

  // ─── Render zonas tabs ────────────────────────────────────────────────────────

  renderZonas(): void {
    const { zonas, zonaActiva } = this._store.state;
    const el = document.getElementById('zonas-tabs');
    if (!el) return;
    el.innerHTML = zonas.map(z => `
      <button class="zona-tab ${z.id === zonaActiva ? 'active' : ''}" data-zona="${z.id}">
        ${z.nombre}
      </button>
    `).join('');
  }

  // ─── Render mesas (floor plan) ────────────────────────────────────────────────

  renderMesas(): void {
    const { mesas, zonaActiva, mergeMode, mergePrincipal, mergeSelected } = this._store.state;
    const el = document.getElementById('mesas-grid');
    if (!el) return;

    const visible = mesas.filter(m => m.zona_id === zonaActiva);

    el.innerHTML = visible.map(m => {
      let extraClass = '';
      let subLabel   = m.estado === 'por_cobrar' ? 'cobrar' : m.estado;

      if (mergeMode) {
        if (m.id === mergePrincipal?.id)       { extraClass = 'mesa-merge-principal'; subLabel = 'principal'; }
        else if (mergeSelected.includes(m.id)) { extraClass = 'mesa-merge-seleccionada'; subLabel = '✓ unida'; }
        else if (m.estado === 'libre')         { extraClass = 'mesa-merge-disponible'; }
        else                                   { extraClass = 'mesa-merge-dim'; }
      }

      let indicatorHTML = '';
      if (!mergeMode && m.mesa_principal_id) {
        const principal = mesas.find(x => x.id === m.mesa_principal_id);
        indicatorHTML = `<span class="mesa-union-indicator">↗ ${principal?.nombre ?? ''}</span>`;
        subLabel = 'unida';
      }

      const cap = m.capacidad || 4;
      const pers = m.personas || 0;
      const topCount = Math.ceil(cap / 2);
      const botCount = Math.floor(cap / 2);
      const ocupTop  = Math.min(pers, topCount);
      const ocupBot  = Math.max(0, pers - ocupTop);

      const siTop = Array.from({ length: topCount }, (_, i) =>
        `<div class="silla ${i < ocupTop ? 'silla-ocup' : ''}"></div>`
      ).join('');
      const siBot = Array.from({ length: botCount }, (_, i) =>
        `<div class="silla ${i < ocupBot ? 'silla-ocup' : ''}"></div>`
      ).join('');

      return `
        <div class="mesa-fp mesa-${m.estado} ${extraClass}"
          style="--top-count:${topCount}"
          data-mesa-id="${m.id}">
          <div class="sillas-top">${siTop}</div>
          <div style="position:relative;display:inline-block">
            ${indicatorHTML}
            <div class="mesa-superficie">
              <span class="mesa-fp-nombre">${m.nombre}</span>
              <span class="mesa-fp-personas">${pers}/${cap}</span>
              <span class="mesa-fp-estado">${subLabel}</span>
            </div>
          </div>
          <div class="sillas-bottom">${siBot}</div>
        </div>
      `;
    }).join('');
  }

  // ─── Click handler ────────────────────────────────────────────────────────────

  handleMesaClick(mesaId: number): void {
    const { mergeMode, mergePrincipal, mergeSelected } = this._store.state;
    const mesa = this._store.getMesa(mesaId);
    if (!mesa) return;

    // Modo unión: seleccionar/deseleccionar mesas libres
    if (mergeMode) {
      if (mesa.id === mergePrincipal?.id) return;
      if (mesa.estado !== 'libre') return;
      this._store.toggleMergeSelect(mesaId);
      document.getElementById('merge-bar-confirm')?.toggleAttribute(
        'disabled', mergeSelected.length === 0,
      );
      const principal = mergePrincipal?.nombre ?? '—';
      const count = this._store.state.mergeSelected.length;
      const label = document.getElementById('merge-bar-label');
      if (label) label.innerHTML = `Unir con <strong>${principal}</strong> — ${count} mesa(s) seleccionada(s)`;
      this.renderMesas();
      return;
    }

    // Mesa secundaria unida → redirigir a la principal
    if (mesa.mesa_principal_id) {
      const principal = this._store.getMesa(mesa.mesa_principal_id);
      if (principal && principal.estado === 'ocupada') this._onOpenTPV(principal.id);
      return;
    }

    if (mesa.estado === 'libre') {
      this._onAbrirAccionMesa(mesa);
    } else if (mesa.estado === 'ocupada' || mesa.estado === 'por_cobrar') {
      this._onOpenTPV(mesaId);
    } else {
      toast('Esta mesa no está disponible');
    }
  }

  // ─── Render merge bar ────────────────────────────────────────────────────────

  renderMergeBar(): void {
    const { mergeMode, mergePrincipal } = this._store.state;
    const bar = document.getElementById('merge-bar');
    if (!bar) return;
    bar.style.display = mergeMode ? 'flex' : 'none';
    if (mergeMode) {
      const span = document.getElementById('merge-bar-principal');
      if (span) span.textContent = mergePrincipal?.nombre ?? '—';
      document.getElementById('merge-bar-confirm')?.setAttribute('disabled', '');
    }
  }
}
