import type { MesasStore } from '../mesas.store';
import type { Mesa } from '../mesas.types';

export class ComensalesModal {
  private readonly _store: MesasStore;
  private _callback: (() => void) | null = null;
  private _mesa: Mesa | null = null;
  private _onSugerencia: ((mesa: Mesa) => void) | null = null;
  private _onUnirMesas: ((mesa: Mesa) => void) | null = null;

  constructor(store: MesasStore) {
    this._store = store;
  }

  open(
    titulo: string,
    callback: () => void,
    mesa?: Mesa,
    onSugerencia?: (mesa: Mesa) => void,
    onUnirMesas?: (mesa: Mesa) => void,
  ): void {
    this._callback    = callback;
    this._mesa        = mesa ?? null;
    this._onSugerencia = onSugerencia ?? null;
    this._onUnirMesas  = onUnirMesas ?? null;

    const titEl = document.getElementById('comensales-titulo');
    if (titEl) titEl.textContent = titulo;

    this._renderGrid();
    this._hideWarning();
    this._hideCustom();

    // Si la selección actual ya excede capacidad al abrir, mostrarlo de entrada
    const sel = this._store.state.numComensales || 1;
    if (this._mesa && sel > (this._mesa.capacidad ?? 999)) {
      this._showCapacityWarning(sel);
    }

    const el = document.getElementById('modal-comensales');
    if (el) el.style.display = 'flex';
  }

  handleUnirMesasClick(): void {
    const mesa = this._mesa;
    const cb = this._onUnirMesas;
    if (!mesa || !cb) return;
    this.close();
    cb(mesa);
  }

  close(): void {
    const el = document.getElementById('modal-comensales');
    if (el) el.style.display = 'none';
    this._callback     = null;
    this._mesa         = null;
    this._onSugerencia = null;
    this._onUnirMesas  = null;
  }

  confirm(): void {
    const n   = this._store.state.numComensales;
    const cap = this._mesa?.capacidad ?? Infinity;
    if (n > cap) return;

    const cb = this._callback;
    this.close();
    if (cb) cb();
  }

  // ─── Grid rápido ──────────────────────────────────────────────────────────

  private _renderGrid(): void {
    const sel   = this._store.state.numComensales || 1;
    const gridEl = document.getElementById('comensales-grid');
    if (!gridEl) return;

    const numBtns = Array.from({ length: 8 }, (_, i) => i + 1).map(n => `
      <button class="comensal-btn ${n === sel ? 'selected' : ''}" data-n="${n}">${n}</button>
    `).join('');

    const otroCls = sel > 8 ? 'selected' : '';
    gridEl.innerHTML = numBtns + `
      <button class="comensal-btn otro ${otroCls}" data-n="custom" id="comensal-btn-otro">
        <i class="fa-solid fa-ellipsis"></i>
      </button>
    `;
  }

  // ─── Selección rápida ─────────────────────────────────────────────────────

  selectN(n: number): void {
    this._store.setNumComensales(n);
    this._syncGrid(n);
    this._hideCustom();

    if (this._mesa && n > (this._mesa.capacidad ?? 999)) {
      this._showCapacityWarning(n);
    } else {
      this._hideWarning();
    }
  }

  // ─── Input personalizado ──────────────────────────────────────────────────

  showCustomInput(): void {
    const div   = document.getElementById('comensales-custom');
    const input = document.getElementById('comensales-custom-input') as HTMLInputElement | null;
    const otro  = document.getElementById('comensal-btn-otro');

    if (div)   div.style.display = 'block';
    if (otro)  otro.classList.add('selected');
    if (input) { input.value = ''; input.focus(); }

    // Desmarcar botones numéricos
    document.querySelectorAll<HTMLElement>('#comensales-grid .comensal-btn:not(#comensal-btn-otro)')
      .forEach(b => b.classList.remove('selected'));
  }

  applyCustomInput(): void {
    const input = document.getElementById('comensales-custom-input') as HTMLInputElement | null;
    if (!input) return;
    const n = parseInt(input.value, 10);
    if (n > 0) {
      this._store.setNumComensales(n);
      if (this._mesa && n > (this._mesa.capacidad ?? 999)) {
        this._showCapacityWarning(n);
      } else {
        this._hideWarning();
      }
    }
  }

  // ─── Sugerencia de otra mesa ──────────────────────────────────────────────

  handleSugerenciaClick(mesaId: number): void {
    const cb = this._onSugerencia;
    if (!cb) return;
    const mesa = this._store.state.mesas.find(m => m.id === mesaId);
    if (mesa) {
      this.close();
      cb(mesa);
    }
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private _syncGrid(n: number): void {
    document.querySelectorAll<HTMLElement>('#comensales-grid .comensal-btn').forEach(btn => {
      const isOtro = btn.id === 'comensal-btn-otro';
      btn.classList.toggle('selected', !isOtro && Number(btn.dataset.n) === n);
    });
  }

  private _showCapacityWarning(n: number): void {
    const cap       = this._mesa?.capacidad ?? 0;
    const warningEl = document.getElementById('comensales-warning');
    const textEl    = document.getElementById('comensales-warning-text');
    const sugsEl    = document.getElementById('comensales-sugerencias');
    if (!warningEl || !textEl || !sugsEl) return;

    textEl.innerHTML =
      `<i class="fa-solid fa-triangle-exclamation"></i> ` +
      `Esta mesa soporta hasta <strong>${cap}</strong> personas. ` +
      `Puedes elegir una mesa con más capacidad:`;

    const { mesas } = this._store.state;
    const sugeridas = mesas
      .filter(m =>
        m.id !== this._mesa!.id &&
        m.estado === 'libre' &&
        m.zona_id === this._mesa!.zona_id &&
        (m.capacidad ?? 4) >= n,
      )
      .slice(0, 6);

    if (sugeridas.length) {
      sugsEl.innerHTML = sugeridas.map(m => `
        <button class="comensal-btn sugerencia" data-sugerencia="${m.id}">
          ${m.nombre}<small>${m.capacidad} pers.</small>
        </button>
      `).join('');
    } else {
      sugsEl.innerHTML = `
        <div style="grid-column:1/-1;display:flex;flex-direction:column;gap:10px;align-items:stretch">
          <p style="font-size:12px;color:var(--text-muted);margin:0">
            No hay mesas libres con suficiente capacidad en esta zona.
          </p>
          <button
            class="btn-modal-add"
            style="width:100%;padding:12px 16px;font-size:13px"
            data-unir-desde-comensales
          >
            <i class="fa-solid fa-link"></i> Unir mesas
          </button>
        </div>
      `;
    }

    warningEl.style.display = 'block';
    this._setConfirmDisabled(true);
  }

  private _hideWarning(): void {
    const el = document.getElementById('comensales-warning');
    if (el) el.style.display = 'none';
    this._setConfirmDisabled(false);
  }

  private _setConfirmDisabled(disabled: boolean): void {
    const btn = document.getElementById('btn-confirmar-comensales') as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = disabled;
      btn.style.opacity = disabled ? '0.4' : '';
      btn.style.cursor  = disabled ? 'not-allowed' : '';
    }
  }

  private _hideCustom(): void {
    const el = document.getElementById('comensales-custom');
    if (el) el.style.display = 'none';
  }
}
