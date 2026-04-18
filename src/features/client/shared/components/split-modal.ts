import { fmt } from '../utils/format';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SplitLinea {
  id: number;
  nombre_articulo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal_linea: number;
  cuenta_num: number;
  modificadores: Array<{ nombre_modificador: string }>;
}

export interface SplitImpuesto {
  nombre: string;
  porcentaje: number;
}

export interface SplitConfirmResult {
  lineas: Array<{ id: number; cuenta_num: number }>;
  numCuentas: number;
  cuentasNombres: Record<number, string>;
  desglosadas: Array<{ originalId: number; cuentaNums: number[] }>;
}

export interface SplitModalOpts {
  mesaLabel: string;
  lineas: SplitLinea[];
  numCuentas: number;
  cuentasNombres: Record<number, string>;
  maxCuentas: number;
  impuestos: SplitImpuesto[];
  onConfirm: (result: SplitConfirmResult) => void;
  onCancel: () => void;
}

// ─── Colores por cuenta ───────────────────────────────────────────────────────

const PALETTE = [
  { bg: 'rgba(26,82,204,0.13)',   fg: 'var(--blue,#1a52cc)',    bd: 'rgba(26,82,204,0.30)' },
  { bg: 'rgba(197,98,0,0.13)',    fg: 'var(--orange,#c56200)',  bd: 'rgba(197,98,0,0.28)' },
  { bg: 'rgba(0,144,76,0.13)',    fg: 'var(--green,#00904c)',   bd: 'rgba(0,144,76,0.28)' },
  { bg: 'rgba(124,58,237,0.13)',  fg: '#7c3aed',                bd: 'rgba(124,58,237,0.28)' },
  { bg: 'rgba(198,40,40,0.13)',   fg: 'var(--red,#c62828)',     bd: 'rgba(198,40,40,0.28)' },
  { bg: 'rgba(0,137,167,0.13)',   fg: '#0089a7',                bd: 'rgba(0,137,167,0.28)' },
];

function badgeStyle(n: number): string {
  const c = PALETTE[(n - 1) % PALETTE.length];
  return `background:${c.bg};color:${c.fg};border:1px solid ${c.bd};`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const SPM_CSS = `
.spm-overlay {
  position:fixed;inset:0;z-index:9000;
  background:rgba(0,0,0,0.55);backdrop-filter:blur(3px);
  display:flex;align-items:center;justify-content:center;padding:12px;
  opacity:0;transition:opacity 0.18s;
}
.spm-overlay.spm-open { opacity:1; }
.spm-box {
  background:var(--bg);border:1px solid var(--border);border-radius:14px;
  box-shadow:0 28px 70px rgba(0,0,0,0.38);
  display:flex;flex-direction:column;
  width:100%;max-width:860px;max-height:90vh;overflow:hidden;
  transform:translateY(14px) scale(0.99);transition:transform 0.18s;
}
.spm-open .spm-box { transform:translateY(0) scale(1); }

/* Header */
.spm-header {
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 20px;border-bottom:1px solid var(--border);flex-shrink:0;
}
.spm-header-title {
  font-size:15px;font-weight:700;
  display:flex;align-items:center;gap:8px;color:var(--text);
}
.spm-header-title i { color:var(--accent); }
.spm-close {
  width:32px;height:32px;border-radius:8px;border:none;
  background:var(--surface2);color:var(--text-muted);cursor:pointer;font-size:14px;
  display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;
}
.spm-close:hover { background:var(--surface3);color:var(--text); }

/* Body */
.spm-body {
  display:grid;grid-template-columns:1fr 1fr;
  flex:1;overflow:hidden;min-height:0;
}
.spm-col-items {
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;overflow:hidden;
}
.spm-col-resumen { display:flex;flex-direction:column;overflow:hidden; }

.spm-col-title {
  padding:9px 16px 8px;font-size:11px;font-weight:700;
  text-transform:uppercase;letter-spacing:0.8px;
  color:var(--text-muted);border-bottom:1px solid var(--border);flex-shrink:0;
}
.spm-col-hint { font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-dim); }

.spm-lineas-scroll  { flex:1;overflow-y:auto;padding:6px;display:flex;flex-direction:column;gap:3px; }
.spm-cuentas-scroll { flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px; }

/* Line item row */
.spm-linea {
  display:flex;align-items:center;gap:8px;
  padding:8px 10px;border-radius:8px;
  border:1px solid transparent;background:var(--surface);
  transition:background 0.12s,border-color 0.12s;cursor:pointer;user-select:none;
}
.spm-linea:hover { background:var(--surface2);border-color:var(--border); }
.spm-linea:active { transform:scale(0.995); }

/* Badge */
.spm-badge {
  display:inline-flex;align-items:center;justify-content:center;
  min-width:28px;height:24px;border-radius:12px;padding:0 7px;
  font-size:11px;font-weight:700;flex-shrink:0;
  cursor:pointer;transition:transform 0.1s,box-shadow 0.1s;letter-spacing:0.2px;
}
.spm-badge:hover { box-shadow:0 0 0 3px rgba(128,128,128,0.18); }
.spm-badge:active { transform:scale(0.88); }
.spm-badge-sm { min-width:24px;height:20px;font-size:10px; }

.spm-linea-info { flex:1;min-width:0; }
.spm-linea-nombre {
  font-size:13px;font-weight:500;color:var(--text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;
}
.spm-linea-mods { font-size:11px;color:var(--text-dim);margin-top:1px; }
.spm-linea-precio { font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-muted);flex-shrink:0; }

/* Account summary cards */
.spm-cuenta-card {
  border:1px solid var(--border);border-radius:10px;
  background:var(--surface);overflow:hidden;
}
.spm-cuenta-card.spm-empty { opacity:0.45; }
.spm-cuenta-header {
  display:flex;align-items:center;gap:8px;
  padding:9px 12px 8px;border-bottom:1px solid var(--border);
  background:var(--surface2);
}
.spm-cuenta-nombre-display {
  flex:1;font-size:13px;font-weight:600;color:var(--text);
  cursor:pointer;padding:2px 6px;border-radius:5px;
  transition:background 0.12s;
}
.spm-cuenta-nombre-display:hover { background:var(--surface3); }
.spm-edit-icon { font-size:10px;color:var(--text-dim);opacity:0.6; }
.spm-nombre-input {
  flex:1;background:var(--surface3);border:1.5px solid var(--accent);
  border-radius:6px;padding:3px 8px;font-family:inherit;font-size:13px;
  color:var(--text);outline:none;
}

.spm-cuenta-items   { padding:8px 12px 2px;display:flex;flex-direction:column;gap:3px; }
.spm-cuenta-totales { padding:6px 12px 10px;border-top:1px dashed var(--border);margin-top:6px;display:flex;flex-direction:column;gap:3px; }
.spm-cuenta-empty   { padding:10px 12px;font-size:12px;color:var(--text-dim);font-style:italic; }

.spm-total-row { display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);gap:8px; }
.spm-total-row.spm-item { color:var(--text);font-size:12px; }
.spm-total-row.spm-grand {
  font-weight:700;font-size:13px;color:var(--text);
  padding-top:5px;border-top:2px solid var(--border);margin-top:3px;
}
.spm-total-row span:last-child { font-family:'JetBrains Mono',monospace; }

.spm-resumen-empty {
  margin:12px;padding:18px 12px;text-align:center;
  color:var(--text-dim);font-size:12px;line-height:1.6;
  border:1px dashed var(--border);border-radius:8px;
}

/* Footer */
.spm-footer {
  display:flex;align-items:center;justify-content:space-between;
  padding:11px 16px;border-top:1px solid var(--border);flex-shrink:0;gap:8px;
  background:var(--surface);
}
.spm-footer-left  { display:flex;gap:8px; }
.spm-footer-right { display:flex;gap:8px; }
.spm-footer-quitar-confirm {
  display:flex;align-items:center;gap:10px;
  font-size:13px;color:var(--text-muted);flex-wrap:wrap;
}

.spm-btn {
  padding:9px 16px;border-radius:var(--radius);
  font-family:inherit;font-size:13px;font-weight:600;
  cursor:pointer;transition:all 0.15s;display:inline-flex;align-items:center;gap:6px;
  white-space:nowrap;
}
.spm-btn-cancel  { border:1px solid var(--border);background:var(--surface2);color:var(--text-muted); }
.spm-btn-cancel:hover { background:var(--surface3);color:var(--text); }
.spm-btn-confirm { border:none;background:var(--accent);color:#fff; }
.spm-btn-confirm:hover { opacity:0.88; }
.spm-btn-quitar  { border:1px solid rgba(198,40,40,0.3);background:rgba(198,40,40,0.08);color:var(--red,#c62828); }
.spm-btn-quitar:hover  { background:rgba(198,40,40,0.15); }
.spm-btn-quitar-yes { border:none;background:var(--red,#c62828);color:#fff; }

/* Error */
.spm-footer-error {
  width:100%;padding:6px 4px 0;font-size:12px;
  color:var(--red,#c62828);display:flex;align-items:center;gap:5px;
}

/* Desglosar */
.spm-btn-desglosar {
  background:none;border:none;cursor:pointer;
  color:var(--text-dim);padding:3px 5px;border-radius:5px;font-size:11px;
  flex-shrink:0;transition:color 0.12s,background 0.12s;
}
.spm-btn-desglosar:hover { color:var(--accent);background:var(--surface3); }
.spm-linea-virtual {
  border-left:2px solid var(--border);margin-left:12px;opacity:0.9;
}
`;


// ─── SplitModal ───────────────────────────────────────────────────────────────

export class SplitModal {
  private _el: HTMLElement | null = null;

  // Estado local de edición (copia en memoria — no toca la BD hasta confirmar)
  private _errorMsg = '';
  private _lineas: SplitLinea[] = [];
  private _numCuentas = 1;
  private _cuentasNombres: Record<number, string> = {};
  private _maxCuentas = 8;
  private _impuestos: SplitImpuesto[] = [];
  private _mesaLabel = '';
  private _onConfirm!: SplitModalOpts['onConfirm'];
  private _onCancel!: SplitModalOpts['onCancel'];

  // Desglose: líneas virtuales (id < 0) generadas al desglosar una línea agrupada
  private _virtualToOriginal = new Map<number, number>(); // virtual_id → original_id
  private _originalLineasBackup = new Map<number, SplitLinea>(); // original_id → línea original
  private _nextVirtualId = -1;

  // ─── API pública ─────────────────────────────────────────────────────────────

  open(opts: SplitModalOpts): void {
    this.close();

    // Copiar estado inicial — los cambios son locales hasta "Confirmar"
    this._lineas               = opts.lineas.map(l => ({ ...l }));
    this._numCuentas           = opts.numCuentas;
    this._cuentasNombres       = { ...opts.cuentasNombres };
    this._maxCuentas           = Math.max(opts.maxCuentas, 2);
    this._impuestos            = opts.impuestos;
    this._mesaLabel            = opts.mesaLabel;
    this._onConfirm            = opts.onConfirm;
    this._onCancel             = opts.onCancel;
    this._virtualToOriginal    = new Map();
    this._originalLineasBackup = new Map();
    this._nextVirtualId        = -1;
    this._errorMsg             = '';

    this._injectStyles();
    this._el = document.createElement('div');
    this._el.className = 'spm-overlay';
    document.body.appendChild(this._el);
    this._bindEvents();
    this._render();
    requestAnimationFrame(() => this._el?.classList.add('spm-open'));
  }

  close(): void {
    this._el?.remove();
    this._el = null;
  }

  // ─── Renderizado ─────────────────────────────────────────────────────────────

  private _injectStyles(): void {
    if (document.getElementById('spm-styles')) return;
    const s = document.createElement('style');
    s.id = 'spm-styles';
    s.textContent = SPM_CSS;
    document.head.appendChild(s);
  }

  private _render(): void {
    if (!this._el) return;
    this._el.innerHTML = `
      <div class="spm-box">
        ${this._buildHeader()}
        <div class="spm-body">
          <div class="spm-col-items">
            <div class="spm-col-title">Artículos <span class="spm-col-hint">· clic en badge para cambiar cuenta</span></div>
            <div class="spm-lineas-scroll">${this._buildLineas()}</div>
          </div>
          <div class="spm-col-resumen">
            <div class="spm-col-title">Resumen por cuenta</div>
            <div class="spm-cuentas-scroll">${this._buildResumen()}</div>
          </div>
        </div>
        ${this._buildFooter()}
      </div>`;
  }

  private _buildHeader(): string {
    return `
      <div class="spm-header">
        <div class="spm-header-title">
          <i class="fa-solid fa-divide"></i>
          Dividir cuenta &nbsp;·&nbsp; ${this._mesaLabel}
        </div>
        <button class="spm-close" data-spm="cancel" aria-label="Cerrar">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`;
  }

  private _buildLineas(): string {
    if (!this._lineas.length) {
      return '<div class="spm-resumen-empty">Sin artículos en esta orden</div>';
    }
    return this._lineas.map(l => {
      const cn        = l.cuenta_num || 1;
      const style     = badgeStyle(cn);
      const nombre    = this._cuentasNombres[cn] ?? `C${cn}`;
      const isVirtual = l.id < 0;
      const mods      = l.modificadores?.length
        ? `<div class="spm-linea-mods">${l.modificadores.map(m => `└ ${m.nombre_modificador}`).join(' · ')}</div>`
        : '';
      const labelNombre = isVirtual
        ? `└ ${l.nombre_articulo}`
        : `${l.cantidad}× ${l.nombre_articulo}`;
      const desglosarBtn = !isVirtual && l.cantidad > 1
        ? `<button class="spm-btn-desglosar" data-spm="desglosar" data-spm-id="${l.id}" title="Desglosar en unidades individuales"><i class="fa-solid fa-scissors"></i></button>`
        : '';
      const lineaClass = isVirtual ? 'spm-linea spm-linea-virtual' : 'spm-linea';
      return `
        <div class="${lineaClass}" data-spm="ciclar" data-spm-id="${l.id}">
          <span class="spm-badge" style="${style}" title="Cuenta ${cn}${this._cuentasNombres[cn] ? ': ' + this._cuentasNombres[cn] : ''}">${nombre}</span>
          <div class="spm-linea-info">
            <span class="spm-linea-nombre">${labelNombre}</span>
            ${mods}
          </div>
          <span class="spm-linea-precio">${fmt(l.subtotal_linea)}</span>
          ${desglosarBtn}
        </div>`;
    }).join('');
  }

  private _buildResumen(): string {
    const tieneMultiples = this._lineas.some(l => (l.cuenta_num || 1) > 1);
    if (!tieneMultiples) {
      return `<div class="spm-resumen-empty">
        Toca el badge de un artículo para asignarlo a otra cuenta.<br>
        El badge mostrará C1, C2, C3… según la cuenta asignada.
      </div>`;
    }

    // Solo mostrar cuentas que tienen artículos asignados — nunca cuentas vacías
    const cuentas = [...new Set(this._lineas.map(l => l.cuenta_num || 1))].sort((a, b) => a - b);
    return cuentas.map(n => {
      const items  = this._lineas.filter(l => (l.cuenta_num || 1) === n);
      const style  = badgeStyle(n);
      const nombre = this._cuentasNombres[n] ?? `Cuenta ${n}`;

      const sub     = Math.round(items.reduce((s, l) => s + Number(l.subtotal_linea), 0) * 100) / 100;
      const desglose = this._impuestos.map(i => ({
        nombre:     i.nombre,
        porcentaje: i.porcentaje,
        monto:      Math.round(sub * (i.porcentaje / 100) * 100) / 100,
      }));
      const imp   = Math.round(desglose.reduce((s, d) => s + d.monto, 0) * 100) / 100;
      const total = Math.round((sub + imp) * 100) / 100;

      const itemRows = items.map(l =>
        `<div class="spm-total-row spm-item"><span>${l.cantidad}× ${l.nombre_articulo}</span><span>${fmt(l.subtotal_linea)}</span></div>`
      ).join('');
      const impRows = desglose.map(d =>
        `<div class="spm-total-row"><span>${d.nombre} ${d.porcentaje}%</span><span>${fmt(d.monto)}</span></div>`
      ).join('');

      return `
        <div class="spm-cuenta-card">
          <div class="spm-cuenta-header">
            <span class="spm-badge spm-badge-sm" style="${style}">C${n}</span>
            <span class="spm-cuenta-nombre-display" data-spm="edit-nombre" data-spm-n="${n}" title="Clic para asignar nombre">${nombre}</span>
            <i class="fa-solid fa-pen spm-edit-icon"></i>
          </div>
          <div class="spm-cuenta-items">${itemRows}</div>
          <div class="spm-cuenta-totales">
            <div class="spm-total-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>
            ${impRows}
            <div class="spm-total-row spm-grand"><span>Total C${n}</span><span>${fmt(total)}</span></div>
          </div>
        </div>`;
    }).join('');
  }

  private _buildFooter(mode: 'normal' | 'confirm-quitar' = 'normal'): string {
    const tieneMultiples = this._lineas.some(l => (l.cuenta_num || 1) > 1);

    if (mode === 'confirm-quitar') {
      return `
        <div class="spm-footer">
          <div class="spm-footer-quitar-confirm">
            <span>¿Quitar toda la división?</span>
            <button class="spm-btn spm-btn-quitar-yes" data-spm="quitar-yes">
              <i class="fa-solid fa-check"></i> Sí, quitar
            </button>
            <button class="spm-btn spm-btn-cancel" data-spm="quitar-no">No</button>
          </div>
        </div>`;
    }

    return `
      <div class="spm-footer">
        <div class="spm-footer-left">
          ${tieneMultiples ? `
            <button class="spm-btn spm-btn-quitar" data-spm="quitar">
              <i class="fa-solid fa-xmark"></i> Quitar división
            </button>` : ''}
        </div>
        <div class="spm-footer-right">
          <button class="spm-btn spm-btn-cancel" data-spm="cancel">Cancelar</button>
          <button class="spm-btn spm-btn-confirm" data-spm="confirm">
            <i class="fa-solid fa-check"></i> Confirmar división
          </button>
        </div>
      </div>
      ${this._errorMsg ? `<div class="spm-footer-error"><i class="fa-solid fa-circle-exclamation"></i> ${this._errorMsg}</div>` : ''}`;
  }

  // ─── Eventos ─────────────────────────────────────────────────────────────────

  private _bindEvents(): void {
    if (!this._el) return;

    this._el.addEventListener('click', e => {
      const t  = e.target as HTMLElement;
      const el = t.closest<HTMLElement>('[data-spm]');
      if (!el) return;

      switch (el.dataset.spm) {
        case 'ciclar':       this._ciclar(Number(el.dataset.spmId)); break;
        case 'desglosar':    this._desglosaLinea(Number(el.dataset.spmId)); break;
        case 'edit-nombre':  this._editarNombre(Number(el.dataset.spmN), el); break;
        case 'confirm':      this._confirmar(); break;
        case 'cancel':       this._cancelar(); break;
        case 'quitar':       this._mostrarConfirmQuitar(); break;
        case 'quitar-yes':   this._quitarDivision(); break;
        case 'quitar-no':    this._render(); break; // restaurar footer normal
      }
    });

    // Cerrar al hacer clic fuera del box
    this._el.addEventListener('click', e => {
      if (e.target === this._el) this._cancelar();
    });
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────────

  private _ciclar(lineaId: number): void {
    const linea = this._lineas.find(l => l.id === lineaId);
    if (!linea) return;
    const actual = linea.cuenta_num || 1;
    const next   = actual + 1;

    if (next > this._numCuentas) {
      // Item está en la última cuenta. Solo creamos una nueva si la cuenta actual
      // quedará con al menos otro artículo; si no, la dejamos vacía y volvemos a C1.
      const hayOtrosEnEsta = this._lineas.some(l => l.id !== lineaId && (l.cuenta_num || 1) === actual);
      if (hayOtrosEnEsta && this._numCuentas < this._maxCuentas) {
        this._numCuentas++;
        linea.cuenta_num = this._numCuentas;
      } else {
        linea.cuenta_num = 1; // volver a C1 (ciclo completo)
      }
    } else {
      linea.cuenta_num = next;
    }
    this._render();
  }

  private _editarNombre(n: number, displayEl: HTMLElement): void {
    const input = document.createElement('input');
    input.type        = 'text';
    input.className   = 'spm-nombre-input';
    input.value       = this._cuentasNombres[n] ?? '';
    input.placeholder = `Cuenta ${n}`;
    input.maxLength   = 30;

    displayEl.replaceWith(input);
    input.focus();
    input.select();

    const guardar = () => {
      const v = input.value.trim();
      if (v) this._cuentasNombres[n] = v;
      else   delete this._cuentasNombres[n];
      this._render();
    };

    input.addEventListener('blur', guardar);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); guardar(); }
      if (e.key === 'Escape') { this._render(); }
    });
  }

  private _mostrarConfirmQuitar(): void {
    const footer = this._el?.querySelector<HTMLElement>('.spm-footer');
    if (!footer) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = this._buildFooter('confirm-quitar');
    footer.replaceWith(tmp.firstElementChild!);
    // Event delegation on this._el still captures clicks on the new footer — no re-bind needed
  }

  private _desglosaLinea(lineaId: number): void {
    const idx = this._lineas.findIndex(l => l.id === lineaId);
    if (idx === -1) return;
    const linea = this._lineas[idx];
    this._originalLineasBackup.set(lineaId, { ...linea });
    this._lineas.splice(idx, 1);
    const subtotalUnit = Math.round(linea.precio_unitario * 100) / 100;
    for (let i = 0; i < linea.cantidad; i++) {
      const vid = this._nextVirtualId--;
      this._virtualToOriginal.set(vid, lineaId);
      this._lineas.splice(idx + i, 0, {
        ...linea,
        id:            vid,
        cantidad:      1,
        subtotal_linea: subtotalUnit,
      });
    }
    this._render();
  }

  private _quitarDivision(): void {
    // Restaurar líneas originales de desgloses
    for (const [originalId, originalLinea] of this._originalLineasBackup) {
      const virtualIds = [...this._virtualToOriginal.entries()]
        .filter(([, origId]) => origId === originalId)
        .map(([vid]) => vid);
      this._lineas = this._lineas.filter(l => !virtualIds.includes(l.id));
      this._lineas.push({ ...originalLinea, cuenta_num: 1 });
    }
    this._virtualToOriginal.clear();
    this._originalLineasBackup.clear();

    this._lineas.forEach(l => { l.cuenta_num = 1; });
    this._numCuentas     = 1;
    this._cuentasNombres = {};
    this._confirmar();
  }

  private _confirmar(): void {
    const realLineas    = this._lineas.filter(l => l.id > 0);
    const virtualLineas = this._lineas.filter(l => l.id < 0);

    // Validar que no haya cuentas vacías (sin artículos asignados)
    if (realLineas.length > 0 || virtualLineas.length > 0) {
      const maxN = Math.max(
        ...realLineas.map(l => l.cuenta_num || 1),
        ...virtualLineas.map(l => l.cuenta_num || 1),
        1,
      );
      const cuentasConItems = new Set([
        ...realLineas.map(l => l.cuenta_num || 1),
        ...virtualLineas.map(l => l.cuenta_num || 1),
      ]);
      for (let n = 1; n <= maxN; n++) {
        if (!cuentasConItems.has(n)) {
          this._errorMsg = `La cuenta ${n} no tiene artículos. Asígnale artículos o quita la división.`;
          this._render();
          return;
        }
      }
    }
    this._errorMsg = '';

    // Agrupar líneas virtuales por original → desglosadas
    const groups = new Map<number, number[]>();
    for (const vl of virtualLineas) {
      const origId = this._virtualToOriginal.get(vl.id)!;
      if (!groups.has(origId)) groups.set(origId, []);
      groups.get(origId)!.push(vl.cuenta_num || 1);
    }
    const desglosadas = [...groups.entries()].map(([originalId, cuentaNums]) => ({ originalId, cuentaNums }));

    const maxUsado = Math.max(
      ...realLineas.map(l => l.cuenta_num || 1),
      ...virtualLineas.map(l => l.cuenta_num || 1),
      1,
    );
    this._numCuentas = maxUsado;

    this._onConfirm({
      lineas:         realLineas.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })),
      numCuentas:     this._numCuentas,
      cuentasNombres: { ...this._cuentasNombres },
      desglosadas,
    });
    this.close();
  }

  private _cancelar(): void {
    this._onCancel();
    this.close();
  }
}
