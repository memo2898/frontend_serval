import type { MesasStore } from '../mesas.store';
import type { Mesa, Zona } from '../mesas.types';

export class MoverOrdenModal {
  private readonly _store: MesasStore;
  private readonly _onConfirm: (targetMesaId: number, targetNombre: string) => void;
  private readonly _getMesasByZona: (zonaId: number) => Promise<Mesa[]>;

  constructor(
    store: MesasStore,
    onConfirm: (targetMesaId: number, targetNombre: string) => void,
    getMesasByZona: (zonaId: number) => Promise<Mesa[]>,
  ) {
    this._store = store;
    this._onConfirm = onConfirm;
    this._getMesasByZona = getMesasByZona;
  }

  open(): void {
    this._openModal(this._store.state.mesaId, this._onConfirm);
  }

  openFromFloorPlan(sourceMesaId: number, onConfirm: (targetId: number, targetNombre: string) => void): void {
    this._openModal(sourceMesaId, onConfirm);
  }

  close(): void {
    const overlay = document.getElementById('modal-mover-orden');
    if (overlay) overlay.style.display = 'none';
  }

  private _openModal(sourceMesaId: number | null, onConfirm: (targetId: number, targetNombre: string) => void): void {
    const el = document.getElementById('mover-orden-grid');
    const overlay = document.getElementById('modal-mover-orden');
    if (!el || !overlay) return;

    el.innerHTML = '<p style="padding:16px 24px;color:var(--text-muted);font-size:13px;grid-column:1/-1">Cargando mesas…</p>';
    overlay.style.display = 'flex';

    this._fetchLibresTodas(sourceMesaId).then(grupos => {
      this._renderGrupos(el, grupos, onConfirm);
    });
  }

  private async _fetchLibresTodas(
    sourceMesaId: number | null,
  ): Promise<Array<{ zona: Zona; mesas: Mesa[] }>> {
    const zonas = this._store.state.zonas;
    const resultados = await Promise.all(
      zonas.map(async zona => {
        const mesas = await this._getMesasByZona(zona.id);
        return {
          zona,
          mesas: mesas.filter(m =>
            m.estado === 'libre' && m.id !== sourceMesaId && !m.mesa_principal_id,
          ),
        };
      }),
    );
    return resultados.filter(g => g.mesas.length > 0);
  }

  private _renderGrupos(
    el: HTMLElement,
    grupos: Array<{ zona: Zona; mesas: Mesa[] }>,
    onConfirm: (targetId: number, targetNombre: string) => void,
  ): void {
    if (!grupos.length) {
      el.innerHTML = '<p style="padding:16px 24px;color:var(--text-muted);font-size:13px;grid-column:1/-1">No hay mesas libres disponibles</p>';
      return;
    }

    el.innerHTML = grupos.map(({ zona, mesas }) => `
      <div style="grid-column:1/-1;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;padding:8px 0 4px">${zona.nombre}</div>
      ${mesas.map(m => `
        <button class="unir-mesa-btn" data-mover-target="${m.id}" data-mover-nombre="${m.nombre}">
          <span class="unir-mesa-nombre">${m.nombre}</span>
        </button>
      `).join('')}
    `).join('');

    el.querySelectorAll<HTMLButtonElement>('[data-mover-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = Number(btn.dataset.moverTarget);
        const targetNombre = btn.dataset.moverNombre ?? '';
        this.close();
        onConfirm(targetId, targetNombre);
      });
    });
  }
}
