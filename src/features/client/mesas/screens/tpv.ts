import { fmt } from '../../shared/utils/format';
import { isSuperAdmin } from '@/global/guards_auth';
import type { MesasStore } from '../mesas.store';

export class TpvScreen {
  private readonly _store: MesasStore;
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

  renderArticulos(search = ''): void {
    const { articulos } = this._store.state;
    const el = document.getElementById('articulos-grid');
    if (!el) return;
    const term = search.trim().toLowerCase();
    const lista = term
      ? articulos.filter(a => a.nombre.toLowerCase().includes(term))
      : articulos;
    if (!lista.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-utensils"></i></div><span>' + (term ? 'Sin resultados' : 'Sin artículos') + '</span></div>';
      return;
    }
    el.innerHTML = lista.map(a => {
      const iconoGris = `<i class="fa-regular fa-image" style="font-size:32px;color:var(--text-muted)"></i>`;
      const media = a.imagen
        ? `<img src="${a.imagen}" alt="${a.nombre}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${iconoGris.replace('style="', 'style="display:none;')}`
        : iconoGris;
      return `
        <div class="articulo-card" data-articulo="${a.id}">
          <div class="articulo-imagen">${media}</div>
          <div class="articulo-nombre">${a.nombre}</div>
          <div class="articulo-precio">${fmt(a.precio_venta)}</div>
        </div>
      `;
    }).join('');
  }

  // ─── Render orden ─────────────────────────────────────────────────────────────

  renderOrden(): void {
    const { orden, lineas, mesaLabel, numComensales, lineaSeleccionada, splitMode,
            lineasNuevasIds, cuentasNombres, numCuentas, cuentaFiltroTPV } = this._store.state;
    const user = this._getUserNombre();

    const numEl = document.getElementById('orden-num');
    const num = orden?.numero_orden ?? orden?.id;
    if (numEl) numEl.textContent = 'ORDEN #' + (num != null ? num.toString().padStart(4, '0') : '—');

    const infoEl = document.getElementById('orden-info');
    if (infoEl) {
      infoEl.innerHTML =
        `Mesa ${mesaLabel} · ${user} · <span data-cambiar-comensales style="cursor:pointer;border-bottom:1px dotted currentColor">` +
        `${numComensales} ${numComensales === 1 ? 'comensal' : 'comensales'} <i class="fa-solid fa-pen" style="font-size:0.75em"></i></span>`;
    }

    // ── Chips de cuenta ──────────────────────────────────────────────────────
    const chipsEl = document.getElementById('tpv-cuentas-chips');
    if (chipsEl) {
      if (splitMode && numCuentas > 1) {
        const chips = Array.from({ length: numCuentas }, (_, i) => i + 1).map(n => {
          const nombre  = cuentasNombres[n];
          const sub     = lineas.filter(l => (l.cuenta_num || 1) === n)
                                .reduce((s, l) => s + Number(l.subtotal_linea), 0);
          const label   = nombre ? nombre : `C${n}`;
          const cls     = n <= 3 ? 'c' + n : 'cX';
          const active  = cuentaFiltroTPV === n ? ' active' : '';
          return `<button class="tpv-cuenta-chip ${cls}${active}" data-filtro-cuenta="${n}">${label} · ${fmt(sub)}</button>`;
        });
        chipsEl.innerHTML =
          `<button class="tpv-cuenta-chip all${cuentaFiltroTPV === null ? ' active' : ''}" data-filtro-cuenta="all">Todo</button>` +
          chips.join('');
        chipsEl.style.display = 'flex';
      } else {
        chipsEl.innerHTML = '';
        chipsEl.style.display = 'none';
      }
    }

    // ── Líneas (filtradas por cuenta si hay chip activo) ─────────────────────
    const linesEl = document.getElementById('orden-lineas');
    if (!linesEl) return;

    linesEl.classList.toggle('split-mode', splitMode);

    const filtro        = splitMode && cuentaFiltroTPV !== null ? cuentaFiltroTPV : null;
    const lineasVisibles = filtro !== null
      ? lineas.filter(l => (l.cuenta_num || 1) === filtro)
      : lineas;

    if (!lineasVisibles.length) {
      linesEl.innerHTML = lineas.length
        ? '<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-utensils"></i></div><span>Sin artículos en esta cuenta</span></div>'
        : '<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-utensils"></i></div><span>Orden vacía</span></div>';
    } else {
      linesEl.innerHTML = lineasVisibles.map(l => {
        const sel      = lineaSeleccionada?.id === l.id;
        const cn       = l.cuenta_num || 1;
        const badgeCls = cn <= 3 ? 'c' + cn : 'cX';
        const cuentaNombre = cuentasNombres[cn];
        const badgeLabel   = cuentaNombre ? cuentaNombre : `C${cn}`;
        const badgeExtra   = cuentaNombre ? ' has-nombre' : '';
        const badge        = splitMode
          ? `<span class="cuenta-badge ${badgeCls}${badgeExtra}" data-ciclar="${l.id}" title="${cuentaNombre ? 'Cuenta ' + cn + ': ' + cuentaNombre : 'Mantén pulsado para nombrar'}">${badgeLabel}</span>`
          : '';
        const bloqueada = l.enviado_a_cocina;
        const estadoIcon =
          l.estado === 'entregada'   ? '<span class="linea-estado entregada" title="Entregado">✓</span>' :
          l.estado === 'lista'       ? '<span class="linea-estado lista"     title="Listo para recoger">🟢</span>' :
          bloqueada                  ? '<span class="linea-lock"             title="En cocina">🔒</span>' : '';
        return `
          <div class="orden-linea ${sel ? 'selected' : ''} ${bloqueada ? 'enviada' : ''} ${l.estado === 'entregada' ? 'entregada' : ''}" data-linea-select="${l.id}">
            <div class="linea-top">
              ${badge}
              <span class="linea-nombre">${l.cantidad}x ${l.nombre_articulo}</span>
              <span class="linea-precio">${fmt(l.subtotal_linea)}</span>
              ${estadoIcon}
              <button class="linea-nota-btn${l.notas_linea ? ' has-nota' : ''}" data-nota-linea="${l.id}" title="${l.notas_linea ? l.notas_linea.replace(/"/g, '&quot;') : 'Añadir nota'}"><i class="fa-regular fa-comment"></i></button>
            </div>
            ${l.modificadores.map(m => `
              <div class="linea-mod">└─ ${m.nombre_modificador}${m.precio_extra ? ' +' + fmt(m.precio_extra) : ''}</div>
            `).join('')}
            ${sel && (!bloqueada || isSuperAdmin()) ? `
            <div class="linea-controls">
              <button class="qty-btn" data-qty="${l.id}" data-delta="-1" ${bloqueada ? 'disabled' : ''}>−</button>
              <span class="qty-num">${l.cantidad}</span>
              <button class="qty-btn" data-qty="${l.id}" data-delta="1" ${bloqueada ? 'disabled' : ''}>+</button>
              <button class="qty-btn delete${bloqueada ? ' force-delete' : ''}" data-delete="${l.id}" title="${bloqueada ? 'Eliminar ítem en cocina' : ''}"><i class="fa-solid fa-trash"></i></button>
            </div>` : ''}
          </div>
        `;
      }).join('');
    }

    this.renderTotales();

    const btnSplit = document.getElementById('btn-split');
    if (btnSplit) btnSplit.classList.toggle('active', splitMode);

    // ── Botón "Enviar cocina": activo sólo cuando hay líneas pendientes ──
    const hayPendientes = lineas.some(l => !l.enviado_a_cocina);
    const btnCocina = document.querySelector<HTMLButtonElement>('[data-enviar-cocina]');
    if (btnCocina) {
      btnCocina.disabled = !hayPendientes;
      btnCocina.style.opacity = hayPendientes ? '' : '0.45';
    }

    // ── Botón "Pedir cuenta" ──────────────────────────────────────────────────
    // Condiciones: hay líneas y todo fue enviado a cocina/barra
    const hayNuevasSinEnviar = lineasNuevasIds.size > 0 || lineas.some(l => !l.enviado_a_cocina);
    const canPedirCuenta = isSuperAdmin() || (lineas.length > 0 && !hayNuevasSinEnviar);
    const btnCobrar = document.querySelector<HTMLButtonElement>('[data-pedir-cuenta]');
    if (btnCobrar) {
      btnCobrar.disabled = !canPedirCuenta;
      btnCobrar.style.opacity = canPedirCuenta ? '' : '0.45';
      btnCobrar.title = canPedirCuenta ? '' : 'Primero envía los artículos a cocina';
    }

    // ── Botón "Imprimir cuenta provisional" ──────────────────────────────────
    const btnImprimir = document.querySelector<HTMLButtonElement>('[data-imprimir-cuenta]');
    if (btnImprimir) {
      btnImprimir.disabled = lineas.length === 0;
    }
  }

  renderTotales(): void {
    const { orden, impuestos, splitMode, cuentaFiltroTPV, lineas, cuentasNombres } = this._store.state;
    const totEl = document.getElementById('orden-totales');
    if (!totEl || !orden) return;
    const generales = impuestos.filter(i => i.impuesto != null);

    let sub: number;
    let label: string;

    if (splitMode && cuentaFiltroTPV !== null) {
      sub   = lineas.filter(l => (l.cuenta_num || 1) === cuentaFiltroTPV)
                    .reduce((s, l) => s + Number(l.subtotal_linea), 0);
      const nombre = cuentasNombres[cuentaFiltroTPV];
      label = nombre ? nombre : `C${cuentaFiltroTPV}`;
    } else {
      sub   = orden.subtotal ?? 0;
      label = 'TOTAL';
    }

    let impuestoTotal = 0;
    const lineasImpuesto = generales.map(i => {
      const monto = Math.round(sub * (Number(i.impuesto.porcentaje) / 100) * 100) / 100;
      impuestoTotal += monto;
      return `<div class="total-row"><span>${i.impuesto.nombre} ${i.impuesto.porcentaje}%</span><span class="total-val">${fmt(monto)}</span></div>`;
    }).join('');

    const total = generales.length
      ? Math.round((sub + impuestoTotal) * 100) / 100
      : (splitMode && cuentaFiltroTPV !== null ? sub : (orden.total ?? sub));

    totEl.innerHTML = `
      <div class="total-row"><span>Subtotal</span><span class="total-val">${fmt(sub)}</span></div>
      ${lineasImpuesto}
      <div class="total-row grand"><span>${label}</span><span class="total-val">${fmt(total)}</span></div>
    `;
  }


  private _getUserNombre(): string {
    try {
      const raw = localStorage.getItem('pos_user');
      if (raw) return (JSON.parse(raw) as { nombre?: string }).nombre ?? '';
    } catch { /* noop */ }
    return '';
  }
}
