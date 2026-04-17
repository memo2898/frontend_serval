import { fmt } from '../../shared/utils/format';
import type { MesasStore } from '../mesas.store';

export class TpvScreen {
  private readonly _store: MesasStore;
  private _notaTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(store: MesasStore) {
    this._store = store;
  }

  // ─── Render catálogo ──────────────────────────────────────────────────────────

  renderFamilias(): void {
    const { familias, familiaActiva } = this._store.state;
    const el = document.getElementById('familias-tabs');
    if (!el) return;
    el.innerHTML = familias.map(f => `
      <button class="familia-tab ${f.id === familiaActiva ? 'active' : ''}" data-familia="${f.id}">
        ${f.nombre}
      </button>
    `).join('');
  }

  renderArticulos(): void {
    const { articulos } = this._store.state;
    const el = document.getElementById('articulos-grid');
    if (!el) return;
    if (!articulos.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🍽️</div><span>Sin artículos</span></div>';
      return;
    }
    el.innerHTML = articulos.map(a => `
      <div class="articulo-card" data-articulo="${a.id}">
        <div class="articulo-imagen">${a.imagen}</div>
        <div class="articulo-nombre">${a.nombre}</div>
        <div class="articulo-precio">${fmt(a.precio)}</div>
      </div>
    `).join('');
  }

  // ─── Render orden ─────────────────────────────────────────────────────────────

  renderOrden(): void {
    const { orden, lineas, mesaLabel, numComensales, lineaSeleccionada, splitMode } = this._store.state;
    const user = this._getUserNombre();

    const numEl = document.getElementById('orden-num');
    if (numEl) numEl.textContent = 'ORDEN #' + (orden?.numero ?? '—');

    const infoEl = document.getElementById('orden-info');
    if (infoEl) {
      infoEl.innerHTML =
        `Mesa ${mesaLabel} · ${user} · <span data-cambiar-comensales style="cursor:pointer;border-bottom:1px dotted currentColor">` +
        `${numComensales} ${numComensales === 1 ? 'comensal' : 'comensales'} ✎</span>`;
    }

    const linesEl = document.getElementById('orden-lineas');
    if (!linesEl) return;

    if (!lineas.length) {
      linesEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🍽️</div><span>Orden vacía</span></div>';
    } else {
      linesEl.innerHTML = lineas.map(l => {
        const sel      = lineaSeleccionada?.id === l.id;
        const cn       = l.cuenta_num || 1;
        const badgeCls = cn <= 3 ? 'c' + cn : 'cX';
        const badge    = splitMode
          ? `<span class="cuenta-badge ${badgeCls}" data-ciclar="${l.id}">C${cn}</span>`
          : '';
        return `
          <div class="orden-linea ${sel ? 'selected' : ''}" data-linea-select="${l.id}">
            <div class="linea-top">
              ${badge}
              <span class="linea-nombre">${l.cantidad}x ${l.nombre_articulo}</span>
              <span class="linea-precio">${fmt(l.subtotal_linea)}</span>
            </div>
            ${l.modificadores.map(m => `
              <div class="linea-mod">└─ ${m.nombre_modificador}${m.precio_extra ? ' +' + fmt(m.precio_extra) : ''}</div>
            `).join('')}
            ${sel ? `
            <div class="linea-controls">
              <button class="qty-btn" data-qty="${l.id}" data-delta="-1">−</button>
              <span class="qty-num">${l.cantidad}</span>
              <button class="qty-btn" data-qty="${l.id}" data-delta="1">+</button>
              <button class="qty-btn delete" data-delete="${l.id}">🗑</button>
            </div>` : ''}
          </div>
        `;
      }).join('');
    }

    this.renderTotales();

    const btnSplit = document.getElementById('btn-split');
    if (btnSplit) btnSplit.classList.toggle('active', splitMode);
  }

  renderTotales(): void {
    const { orden } = this._store.state;
    const totEl = document.getElementById('orden-totales');
    if (!totEl || !orden) return;
    totEl.innerHTML = `
      <div class="total-row"><span>Subtotal</span><span class="total-val">${fmt(orden.subtotal)}</span></div>
      <div class="total-row"><span>ITBIS 18%</span><span class="total-val">${fmt(orden.impuestos)}</span></div>
      <div class="total-row"><span>Propina 10%</span><span class="total-val">${fmt(orden.propina)}</span></div>
      <div class="total-row grand"><span>TOTAL</span><span class="total-val">${fmt(orden.total)}</span></div>
    `;
  }

  setupNotaDebounce(): void {
    const input = document.getElementById('nota-input') as HTMLTextAreaElement | null;
    if (!input) return;
    input.value = this._store.state.orden?.notas ?? '';
    input.addEventListener('input', () => {
      if (this._notaTimer) clearTimeout(this._notaTimer);
      this._notaTimer = setTimeout(() => {
        this._store.setNota(input.value);
      }, 800);
    });
  }

  private _getUserNombre(): string {
    try {
      const raw = localStorage.getItem('pos_user');
      if (raw) return (JSON.parse(raw) as { nombre?: string }).nombre ?? '';
    } catch { /* noop */ }
    return '';
  }
}
