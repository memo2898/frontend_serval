import { fmt } from '../../shared/utils/format';
import type { MesasStore } from '../mesas.store';
import type { Articulo, GrupoModificador } from '../mesas.types';

export class ModificadoresModal {
  private readonly _store: MesasStore;
  private readonly _onConfirm: (art: Articulo) => void;

  constructor(store: MesasStore, onConfirm: (art: Articulo) => void) {
    this._store = store;
    this._onConfirm = onConfirm;
  }

  open(art: Articulo, grupos: GrupoModificador[]): void {
    this._store.openModal(art, grupos);

    const titleEl = document.getElementById('modal-art-nombre');
    if (titleEl) titleEl.textContent = art.nombre + ' — ' + fmt(art.precio);

    const bodyEl = document.getElementById('modal-grupos');
    if (bodyEl) {
      bodyEl.innerHTML = grupos.map(g => `
        <div class="grupo-mod">
          <div class="grupo-nombre">
            ${g.nombre}
            ${g.obligatorio ? '<span class="req">*</span>' : ''}
            <span style="font-weight:400;font-size:11px">(${g.seleccion === 'unica' ? 'Elegir uno' : 'Varios'})</span>
          </div>
          <div class="mod-options">
            ${g.opciones.map(o => `
              <button class="mod-option" data-grupo="${g.id}" data-opcion="${o.id}" data-sel="${g.seleccion}">
                ${o.nombre}
                ${o.precio_extra ? `<span class="mod-extra">+${fmt(o.precio_extra)}</span>` : ''}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    this._updateBtn();
    const overlay = document.getElementById('modal-mods');
    if (overlay) overlay.style.display = 'flex';
  }

  close(): void {
    this._store.closeModal();
    const overlay = document.getElementById('modal-mods');
    if (overlay) overlay.style.display = 'none';
  }

  toggleOption(grupoId: number, opcionId: number, seleccion: 'unica' | 'multiple'): void {
    this._store.toggleMod(grupoId, opcionId, seleccion);
    // Actualizar clases visuales
    const grupo = this._store.state.modalMods[grupoId];
    if (!grupo) return;
    if (seleccion === 'unica') {
      grupo.opciones.forEach(o => {
        document.querySelector(`[data-grupo="${grupoId}"][data-opcion="${o.id}"]`)
          ?.classList.remove('selected');
      });
    }
    const sel = this._store.state.modalSel[grupoId];
    document.querySelector(`[data-grupo="${grupoId}"][data-opcion="${opcionId}"]`)
      ?.classList.toggle('selected', sel?.has(opcionId) ?? false);
    this._updateBtn();
  }

  confirm(): void {
    const art = this._store.state.modalArticulo;
    if (!art) return;
    this.close();
    this._onConfirm(art);
  }

  private _updateBtn(): void {
    const btn = document.getElementById('btn-agregar-modal') as HTMLButtonElement | null;
    if (btn) btn.disabled = !this._store.isModalValid();
  }
}
