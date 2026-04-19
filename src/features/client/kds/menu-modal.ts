import { getFamilias, getArticulos } from '../mesas/mesas.service';
import { fmt } from '../shared/utils/format';
import type { Familia, Articulo } from '../mesas/mesas.types';

export class MenuModal {
  private _el: HTMLDivElement | null = null;
  private _familias: Familia[] = [];
  private _articulos: Articulo[] = [];
  private _familiaActiva: number | null = null;
  private _loaded = false;
  private readonly _sucursalId: number;

  constructor(sucursalId: number) {
    this._sucursalId = sucursalId;
  }

  async open(): Promise<void> {
    if (!this._el) this._build();
    this._el!.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (!this._loaded) {
      this._loaded = true;
      await this._loadFamilias();
    }
  }

  close(): void {
    this._el?.classList.remove('open');
    document.body.style.overflow = '';
  }

  private _build(): void {
    this._el = document.createElement('div');
    this._el.className = 'menu-modal-overlay';
    this._el.innerHTML = `
      <div class="menu-modal">
        <div class="menu-modal-header">
          <span class="menu-modal-title"><i class="fa-solid fa-utensils"></i> Menú</span>
          <button class="menu-modal-close" id="menu-modal-close-btn">✕</button>
        </div>
        <div class="menu-modal-body">
          <div class="menu-familias-sidebar" id="menu-familias"></div>
          <div class="menu-articulos-grid" id="menu-articulos">
            <div class="menu-placeholder">Cargando menú…</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this._el);

    this._el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target === this._el) { this.close(); return; }

      const closeBtn = target.closest('#menu-modal-close-btn');
      if (closeBtn) { this.close(); return; }

      const tab = target.closest<HTMLElement>('[data-menu-familia]');
      if (tab) this._selectFamilia(Number(tab.dataset.menuFamilia));
    });
  }

  private async _loadFamilias(): Promise<void> {
    const articulosEl = document.getElementById('menu-articulos');
    try {
      this._familias = await getFamilias(this._sucursalId);
      this._renderFamilias();
      if (this._familias.length) {
        await this._selectFamilia(this._familias[0].id);
      } else {
        if (articulosEl) articulosEl.innerHTML = '<div class="menu-placeholder">Sin familias configuradas</div>';
      }
    } catch {
      if (articulosEl) articulosEl.innerHTML = '<div class="menu-placeholder menu-error">Error al cargar el menú</div>';
    }
  }

  private _renderFamilias(): void {
    const el = document.getElementById('menu-familias');
    if (!el) return;
    el.innerHTML = this._familias.map(f => `
      <button class="menu-familia-tab ${f.id === this._familiaActiva ? 'active' : ''}" data-menu-familia="${f.id}">
        ${f.nombre}
      </button>
    `).join('');
  }

  private async _selectFamilia(id: number): Promise<void> {
    this._familiaActiva = id;
    this._renderFamilias();
    const el = document.getElementById('menu-articulos');
    if (el) el.innerHTML = '<div class="menu-placeholder">Cargando…</div>';
    try {
      this._articulos = await getArticulos(id);
      this._renderArticulos();
    } catch {
      if (el) el.innerHTML = '<div class="menu-placeholder menu-error">Error al cargar artículos</div>';
    }
  }

  private _renderArticulos(): void {
    const el = document.getElementById('menu-articulos');
    if (!el) return;
    if (!this._articulos.length) {
      el.innerHTML = '<div class="menu-placeholder">Sin artículos en esta categoría</div>';
      return;
    }
    const iconoGris = `<i class="fa-regular fa-image" style="font-size:28px;color:var(--text-muted)"></i>`;
    el.innerHTML = this._articulos.map(a => {
      const media = a.imagen
        ? `<img src="${a.imagen}" alt="${a.nombre}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${iconoGris.replace('style="', 'style="display:none;')}`
        : iconoGris;
      return `
        <div class="menu-articulo-card">
          <div class="menu-articulo-img">${media}</div>
          <div class="menu-articulo-nombre">${a.nombre}</div>
          <div class="menu-articulo-precio">${fmt(a.precio_venta)}</div>
        </div>
      `;
    }).join('');
  }
}
