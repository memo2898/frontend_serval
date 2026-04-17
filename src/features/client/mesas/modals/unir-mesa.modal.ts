import type { MesasStore } from '../mesas.store';

export class UnirMesaModal {
  private readonly _store: MesasStore;
  private readonly _onConfirm: (mesasIds: number[]) => void;

  constructor(store: MesasStore, onConfirm: (mesasIds: number[]) => void) {
    this._store = store;
    this._onConfirm = onConfirm;
  }

  open(): void {
    const { mesas, mesaId } = this._store.state;
    const mesaPrincipal = mesas.find(m => m.id === mesaId);
    const principalEl = document.getElementById('unir-tpv-principal');
    if (principalEl) principalEl.textContent = mesaPrincipal?.nombre ?? '—';
    this._store.clearUnirTPV();
    this._renderGrid();
    const overlay = document.getElementById('modal-unir-tpv');
    if (overlay) overlay.style.display = 'flex';
  }

  close(): void {
    this._store.clearUnirTPV();
    const overlay = document.getElementById('modal-unir-tpv');
    if (overlay) overlay.style.display = 'none';
  }

  toggleMesa(mesaId: number): void {
    this._store.toggleUnirTPV(mesaId);
    this._renderGrid();
  }

  confirm(): void {
    const selected = [...this._store.state.unirTPVSelected];
    this._store.confirmarUnirTPV();
    this.close();
    this._onConfirm(selected);
  }

  private _renderGrid(): void {
    const { mesas, mesaId, unirTPVSelected } = this._store.state;
    const libres = mesas.filter(m =>
      m.estado === 'libre' && m.id !== mesaId && !m.mesa_principal_id
    );
    const el = document.getElementById('unir-mesas-grid');
    if (!el) return;
    if (!libres.length) {
      el.innerHTML = '<p style="padding:16px 24px;color:var(--text-muted);font-size:13px;grid-column:1/-1">No hay mesas libres disponibles</p>';
    } else {
      el.innerHTML = libres.map(m => `
        <button class="unir-mesa-btn ${unirTPVSelected.includes(m.id) ? 'selected' : ''}" data-unir="${m.id}">
          <span class="unir-mesa-nombre">${m.nombre}</span>
        </button>
      `).join('');
    }
    const btn = document.getElementById('btn-confirmar-unir-tpv') as HTMLButtonElement | null;
    if (btn) btn.disabled = unirTPVSelected.length === 0;
  }
}
