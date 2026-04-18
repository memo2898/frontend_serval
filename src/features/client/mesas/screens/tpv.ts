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
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-utensils"></i></div><span>Sin artículos</span></div>';
      return;
    }
    el.innerHTML = articulos.map(a => {
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
            ordenCompleta, lineasNuevasIds, cuentasNombres } = this._store.state;
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

    const linesEl = document.getElementById('orden-lineas');
    if (!linesEl) return;

    linesEl.classList.toggle('split-mode', splitMode);

    if (!lineas.length) {
      linesEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-utensils"></i></div><span>Orden vacía</span></div>';
    } else {
      linesEl.innerHTML = lineas.map(l => {
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
            </div>
            ${l.modificadores.map(m => `
              <div class="linea-mod">└─ ${m.nombre_modificador}${m.precio_extra ? ' +' + fmt(m.precio_extra) : ''}</div>
            `).join('')}
            ${sel && !bloqueada ? `
            <div class="linea-controls">
              <button class="qty-btn" data-qty="${l.id}" data-delta="-1">−</button>
              <span class="qty-num">${l.cantidad}</span>
              <button class="qty-btn" data-qty="${l.id}" data-delta="1">+</button>
              <button class="qty-btn delete" data-delete="${l.id}"><i class="fa-solid fa-trash"></i></button>
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
    // Condiciones (todas deben cumplirse):
    // 1. Hay líneas en la orden
    // 2. No hay artículos sin enviar a cocina/barra
    // 3. KDS despachó todo (ordenCompleta)
    // 4. No quedan artículos en estado 'lista' esperando ser recogidos
    //    (el camarero debe marcar como entregado antes de pedir la cuenta)
    const hayNuevasSinEnviar    = lineasNuevasIds.size > 0 || lineas.some(l => !l.enviado_a_cocina);
    const hayListasSinEntregar  = lineas.some(l => l.estado === 'lista');
    const canPedirCuenta = lineas.length > 0 && !hayNuevasSinEnviar && ordenCompleta && !hayListasSinEntregar;
    const btnCobrar = document.querySelector<HTMLButtonElement>('[data-pedir-cuenta]');
    if (btnCobrar) {
      btnCobrar.disabled = !canPedirCuenta;
      btnCobrar.style.opacity = canPedirCuenta ? '' : '0.45';
      btnCobrar.title = canPedirCuenta
        ? ''
        : hayNuevasSinEnviar
          ? 'Primero envía los artículos a cocina'
          : hayListasSinEntregar
            ? 'Recoge todos los pedidos antes de cobrar'
            : 'Espera a que cocina/barra despachen todo';
    }
  }

  renderTotales(): void {
    const { orden, impuestos } = this._store.state;
    const totEl = document.getElementById('orden-totales');
    if (!totEl || !orden) return;
    const generales = impuestos.filter(i => i.impuesto != null);
    const sub = orden.subtotal ?? 0;

    let impuestoTotal = 0;
    const lineasImpuesto = generales.map(i => {
      const monto = Math.round(sub * (Number(i.impuesto.porcentaje) / 100) * 100) / 100;
      impuestoTotal += monto;
      return `<div class="total-row"><span>${i.impuesto.nombre} ${i.impuesto.porcentaje}%</span><span class="total-val">${fmt(monto)}</span></div>`;
    }).join('');

    // Recalcular el total desde las tasas cargadas (no confiar en orden.total de la BD)
    const total = generales.length
      ? Math.round((sub + impuestoTotal) * 100) / 100
      : (orden.total ?? sub);

    totEl.innerHTML = `
      <div class="total-row"><span>Subtotal</span><span class="total-val">${fmt(sub)}</span></div>
      ${lineasImpuesto}
      <div class="total-row grand"><span>TOTAL</span><span class="total-val">${fmt(total)}</span></div>
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
