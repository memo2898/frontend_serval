import type { MesasStore } from '../mesas.store';

export class ComensalesModal {
  private readonly _store: MesasStore;
  private _callback: (() => void) | null = null;

  constructor(store: MesasStore) {
    this._store = store;
  }

  open(titulo: string, callback: () => void): void {
    this._callback = callback;
    const titEl = document.getElementById('comensales-titulo');
    if (titEl) titEl.textContent = titulo;

    const sel = this._store.state.numComensales || 1;
    const gridEl = document.getElementById('comensales-grid');
    if (gridEl) {
      gridEl.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1).map(n => `
        <button class="comensal-btn ${n === sel ? 'selected' : ''}" data-n="${n}">${n}</button>
      `).join('');
    }
    const el = document.getElementById('modal-comensales');
    if (el) el.style.display = 'flex';
  }

  close(): void {
    const el = document.getElementById('modal-comensales');
    if (el) el.style.display = 'none';
    this._callback = null;
  }

  confirm(): void {
    const cb = this._callback;
    this.close();
    if (cb) cb();
  }

  selectN(n: number): void {
    this._store.setNumComensales(n);
    document.querySelectorAll<HTMLElement>('#comensales-grid .comensal-btn').forEach(btn => {
      btn.classList.toggle('selected', Number(btn.dataset.n) === n);
    });
  }
}
