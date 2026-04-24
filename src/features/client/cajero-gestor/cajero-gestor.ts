import { checkRoleAccess, isSuperAdmin } from '@/global/guards_auth';
import { doLogout } from '@/global/logOut';
import { initAdminBubble } from '@/components/admin-bubble/admin-bubble';
const _allowed = checkRoleAccess(['cajero-gestor']);
initAdminBubble();

import { SplitModal } from '../shared/components/split-modal';
import type { SplitConfirmResult } from '../shared/components/split-modal';

import { getSucursalId, getUser, getContext } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { fmt, tiempoDesde } from '../shared/utils/format';
import { toast } from '../shared/utils/toast';
import { cajaChannel, mesasChannel, CAJA_QUEUE_KEY, MESAS_UPDATE_KEY } from '../shared/services/pos-channel';
import { posSocket } from '../shared/services/pos-socket';
import { CajaStore } from '../caja/caja.store';
import {
  getQueue, removeFromQueue, confirmarCobro, getFormasPago, fetchLineasOrden,
  getSucursalInfo, getImpuestosCaja, tipoToFaIcon, fetchOrdenesEnCola,
  updateLineaCuenta, updateLineaCaja, crearLineaOrden, saveCuentasNombres,
  fetchOrdenesCobradas, fetchOrdenesProximas,
} from '../caja/caja.service';
import type { TicketCola, OrdenDespachada, OrdenProxima, LineaCobro } from '../caja/caja.types';
import {
  getZonas, getMesasByZona, getFamilias, getAllArticulos,
  getOrdenActivaMesa, getLineas,
  createOrden, createLinea, marcarOrdenEnPreparacion, marcarOrdenPorCobrar,
} from '../mesas/mesas.service';
import type { Zona, Mesa, Familia, Articulo, LineaOrden } from '../mesas/mesas.types';
import {
  getUsuariosStaff, getOrdenesActivas, getOrdenesCobradas,
} from './cajero-gestor.service';
import type { UsuarioCamarero, OrdenResumen } from './cajero-gestor.service';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface LineaLocal {
  articulo_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CajaPage — gestión de cobros (idéntico a caja.ts con rol cajero-gestor)
// ═══════════════════════════════════════════════════════════════════════════════

class CajaPage {
  private readonly _store      = new CajaStore();
  private readonly _splitModal = new SplitModal();
  private _sucursalId     = 0;
  private _nombreEmpresa  = '';
  private _nombreSucursal = '';
  private _logoEmpresa    = '';
  private _cuentaNombreNum = 0;
  private _historialOrdenes: OrdenDespachada[] = [];

  init(): void {
    this._applyTheme();
    this._sucursalId = getSucursalId();
    if (!this._sucursalId) { location.replace(route('/lobby')); return; }

    const user = getUser();
    const userEl = document.getElementById('topbar-user');
    if (userEl) userEl.textContent = user?.nombre ?? '—';

    this._nombreSucursal = getContext()?.nombre_sucursal ?? '';

    getSucursalInfo(this._sucursalId).then(info => {
      if (info.empresa?.nombre) this._nombreEmpresa = info.empresa.nombre;
      if (info.empresa?.logo)   this._logoEmpresa   = info.empresa.logo;
    }).catch(() => {});

    getImpuestosCaja(this._sucursalId).then(imp => {
      this._store.setImpuestos(imp);
      this._renderQueue();
      if (this._store.state.mesaId !== null) {
        this._renderCobroTotales(); this._renderCobro(); this._setMontoPago();
      }
    }).catch(() => {});

    this._loadFormasPago();
    this._loadQueue();
    this._wireEvents();
    this._subscribeChannels();
    this._connectSocket();
    this._setupConnectionIndicator();
  }

  getSucursalId(): number { return this._sucursalId; }

  private _applyTheme(): void {
    document.documentElement.style.setProperty('--accent',     '#00904c');
    document.documentElement.style.setProperty('--accent-rgb', '0,144,76');
  }

  // ─── Indicador de conexión ────────────────────────────────────────────────

  private _setupConnectionIndicator(): void {
    const indicator = document.getElementById('conn-indicator');
    const label     = document.getElementById('conn-label');
    if (!indicator || !label) return;
    document.addEventListener('pos-socket:connected',    () => { indicator.className = 'conn-indicator online';  label.textContent = 'Online'; });
    document.addEventListener('pos-socket:disconnected', () => { indicator.className = 'conn-indicator offline'; label.textContent = 'Sin conexión'; });
    document.addEventListener('pos-socket:error',        () => { indicator.className = 'conn-indicator offline'; label.textContent = 'Sin conexión'; });
  }

  // ─── Socket ───────────────────────────────────────────────────────────────

  private _connectSocket(): void {
    import('@/global/session.service').then(({ getToken }) => {
      const tk = getToken();
      if (!tk) return;
      posSocket.connect(tk, this._sucursalId, 'cajero-gestor');

      posSocket.onCajaOrdenListaCobrar(({ mesa_id, mesa, orden_id }) => {
        const yaEnCola = this._store.state.queue.some(t => t.mesaId === mesa_id);
        if (!yaEnCola) {
          const ticketBasico: TicketCola = {
            id: orden_id, mesaId: mesa_id, mesaLabel: mesa, numComensales: 1,
            orden: { id: orden_id, numero_orden: orden_id, mesa_id, estado: 'por_cobrar', subtotal: 0, impuestos_total: 0, total: 0 },
            lineas: [], splitMode: false, numCuentas: 1, cuentasNombres: {}, timestamp: Date.now(),
          };
          this._store.setQueue([...this._store.state.queue, ticketBasico]);
          this._renderQueue();
          toast(`Nueva orden: ${mesa}`, 'success');
        }
        this._syncFromDB();
      });

      posSocket.onKdsLineasEntregadas(({ orden_id }) => {
        const enCola = this._store.state.queue.some(t => t.id === orden_id);
        if (!enCola) return;
        fetchLineasOrden(orden_id).then(lineas => {
          const subtotal = Math.round(lineas.reduce((s, l) => s + l.subtotal_linea, 0) * 100) / 100;
          const queue = this._store.state.queue.map(t =>
            t.id !== orden_id ? t : { ...t, lineas, orden: { ...t.orden, subtotal } });
          this._store.setQueue(queue);
          localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
          this._renderQueue();
          if (this._store.state.ticketId === orden_id) {
            this._store.setLineas(lineas);
            this._renderCobroLineas(); this._renderCobroTotales();
            this._renderCobro(); this._setMontoPago(); this._renderPrintButtons();
          }
        }).catch(() => {});
      });

      posSocket.onOrdenSplitActualizado(({ orden_id, split_mode, num_cuentas, cuentas_nombres, lineas }) => {
        this._aplicarSplitActualizado(orden_id, split_mode, num_cuentas, cuentas_nombres, lineas);
      });

      posSocket.onCajaPagoRegistrado(({ mesa_id }) => {
        if (mesa_id == null) return;
        if (this._store.state.queue.some(t => t.mesaId === mesa_id)) {
          removeFromQueue(mesa_id); this._store.setQueue(getQueue()); this._renderQueue();
        }
      });

      posSocket.onCajaOrdenAnulada(({ mesa_id }) => {
        removeFromQueue(mesa_id); this._store.setQueue(getQueue()); this._renderQueue();
        toast('Orden anulada');
      });
    });
  }

  // ─── Formas de pago ───────────────────────────────────────────────────────

  private _loadFormasPago(): void {
    getFormasPago()
      .then(formas => { this._store.setFormasPago(formas); if (this._store.state.mesaId !== null) this._renderFormasPago(); })
      .catch(() => toast('Error al cargar formas de pago'));
  }

  // ─── Cola ─────────────────────────────────────────────────────────────────

  private _loadQueue(): void {
    this._store.setQueue(getQueue());
    this._renderQueue();
    this._syncFromDB();
  }

  private _syncFromDB(): void {
    fetchOrdenesEnCola(this._sucursalId).then(ordenes => {
      const local  = this._store.state.queue;
      const merged = ordenes.map(o => {
        const existing = local.find(l => l.id === o.id);
        if (!existing) return o;
        return {
          ...o,
          cuentasNombres: { ...o.cuentasNombres, ...existing.cuentasNombres },
          ...(existing.pagosEnProceso?.length  ? { pagosEnProceso:  existing.pagosEnProceso  } : {}),
          ...(existing.cuentasCobradas?.length ? { cuentasCobradas: existing.cuentasCobradas } : {}),
        };
      });
      this._store.setQueue(merged);
      localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(merged));
      this._renderQueue();
    }).catch(() => {});
  }

  private _aplicarSplitActualizado(
    ordenId: number, splitMode: boolean, numCuentas: number,
    cuentasNombres: Record<number, string>, lineas: Array<{ id: number; cuenta_num: number }>,
  ): void {
    const queue = this._store.state.queue.map(t => {
      if (t.id !== ordenId) return t;
      return { ...t, splitMode, numCuentas, cuentasNombres,
        lineas: t.lineas.map(l => { const u = lineas.find(x => x.id === l.id); return u ? { ...l, cuenta_num: u.cuenta_num } : l; }) };
    });
    this._store.setQueue(queue);
    localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
    this._renderQueue();
    if (this._store.state.ticketId === ordenId) {
      const updated = queue.find(t => t.id === ordenId);
      if (updated) this._store.selectTicket(updated);
      this._renderCuentasTabs(); this._renderCobroLineas(); this._renderCobroTotales();
      this._renderCobro(); this._setMontoPago(); this._renderPrintButtons();
    }
  }

  private _renderQueue(): void {
    const { queue, mesaId } = this._store.state;
    const listEl  = document.getElementById('queue-list')!;
    const emptyEl = document.getElementById('queue-empty')!;
    const countEl = document.getElementById('queue-count')!;
    if (!queue.length) {
      listEl.innerHTML = ''; emptyEl.style.display = 'flex'; countEl.textContent = 'Sin órdenes'; return;
    }
    emptyEl.style.display = 'none';
    countEl.textContent = queue.length + (queue.length === 1 ? ' orden' : ' órdenes');
    listEl.innerHTML = queue.map(t => {
      const sub   = t.orden?.subtotal ?? 0;
      const tasas = this._store.state.impuestos;
      const total = tasas.length ? Math.round((sub + tasas.reduce((s, i) => s + Math.round(sub * (i.porcentaje / 100) * 100) / 100, 0)) * 100) / 100 : (t.orden?.total || sub);
      const mins  = Math.floor((Date.now() - t.timestamp) / 60000);
      const tc    = mins >= 20 ? 'late' : mins >= 10 ? 'warn' : 'normal';
      const split = t.splitMode && t.numCuentas > 1 ? `<span class="queue-split-badge"><i class="fa-solid fa-divide"></i> ${t.numCuentas} cuentas</span>` : '';
      return `<div class="queue-card ${t.mesaId === mesaId ? 'selected' : ''}" data-ticket="${t.mesaId}">
        <div class="queue-card-top"><span class="queue-mesa">${t.mesaLabel}</span><span class="queue-total">${fmt(total)}</span></div>
        <div class="queue-meta">${t.numComensales || 1} comensal(es) · ${t.lineas?.length ?? 0} artículo(s)${split}
          <span class="queue-timer ${tc}"><i class="fa-regular fa-clock"></i> ${tiempoDesde(t.timestamp)}</span>
        </div></div>`;
    }).join('');
  }

  private _selectTicket(mesaId: number): void {
    const ticket = this._store.state.queue.find(t => t.mesaId === mesaId);
    if (!ticket) return;
    this._persistirPagosEnProceso();
    this._store.selectTicket(ticket);
    fetchLineasOrden(ticket.id).then(lineas => { this._store.setLineas(lineas); this._renderCobroLineas(); }).catch(() => {});
    this._renderQueue(); this._renderDetalleHeader(); this._renderCuentasTabs();
    this._renderCobroLineas(); this._renderCobroTotales(); this._renderFormasPago();
    this._renderCobro(); this._setMontoPago(); this._renderPrintButtons();
    document.getElementById('detalle-empty')!.style.display   = 'none';
    document.getElementById('detalle-content')!.style.display = 'flex';
    document.getElementById('pago-empty')!.style.display      = 'none';
    document.getElementById('pago-content')!.style.display    = 'flex';
    document.getElementById('btn-split-caja')?.classList.toggle('active', this._store.state.splitMode);
  }

  // ─── Detalle ──────────────────────────────────────────────────────────────

  private _renderDetalleHeader(): void {
    const { orden, mesaLabel, numComensales, splitMode, numCuentas, ticketId } = this._store.state;
    const numOrden = orden?.numero_orden?.toString().padStart(4, '0') ?? String(ticketId).padStart(4, '0');
    const numEl  = document.getElementById('detalle-num');
    const metaEl = document.getElementById('detalle-meta');
    if (numEl)  numEl.textContent = 'ORDEN #' + numOrden;
    if (metaEl) metaEl.textContent = 'Mesa ' + mesaLabel + ' · ' + numComensales + (numComensales === 1 ? ' comensal' : ' comensales') + (splitMode ? ' · ' + numCuentas + ' cuentas' : '');
  }

  private _renderCuentasTabs(): void {
    const { splitMode, numCuentas, cuentaActivaCobro, cuentasCobradas, cuentasNombres } = this._store.state;
    const el = document.getElementById('cuentas-tabs')!;
    if (!splitMode || numCuentas <= 1) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = Array.from({ length: numCuentas }, (_, i) => i + 1).map(n => {
      const { total } = this._store.getTotalCuenta(n);
      const pagada = cuentasCobradas.has(n);
      const activa = n === cuentaActivaCobro && !pagada;
      const nombre = cuentasNombres[n] ? ` · ${cuentasNombres[n]}` : '';
      return `<button class="cuenta-tab ${activa ? 'active' : ''} ${pagada ? 'pagada' : ''}" data-cuenta="${n}" data-nombre-cuenta="${n}">
        ${pagada ? '<i class="fa-solid fa-check"></i> ' : ''}C${n}${nombre} · ${fmt(total)}
      </button>`;
    }).join('');
    this._renderPrintButtons();
  }

  private _renderPrintButtons(): void {
    const { splitMode, numCuentas, cuentasNombres } = this._store.state;
    const container = document.getElementById('print-buttons');
    if (!container) return;
    if (!splitMode || numCuentas <= 1) {
      container.innerHTML = `<button class="btn-imprimir" id="btn-imprimir"><i class="fa-solid fa-print"></i> Imprimir</button>`;
    } else {
      container.innerHTML = Array.from({ length: numCuentas }, (_, i) => i + 1).map(n => {
        const nombre = cuentasNombres[n] ?? `C${n}`;
        return `<button class="btn-imprimir" data-print-cuenta="${n}"><i class="fa-solid fa-print"></i> ${nombre}</button>`;
      }).join('');
    }
  }

  private _renderCobroLineas(): void {
    const { lineas, splitMode, cuentaActivaCobro, cuentasNombres } = this._store.state;
    const el = document.getElementById('cobro-lineas')!;
    if (!lineas.length) { el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">Cargando artículos…</div>'; return; }
    el.innerHTML = lineas.map(l => {
      const cn = l.cuenta_num || 1;
      const dim = splitMode && cn !== cuentaActivaCobro;
      const bc  = cn <= 3 ? 'c' + cn : 'cX';
      const nombre = cuentasNombres[cn];
      const badge = splitMode ? `<span class="cuenta-badge-cobro ${bc}" data-ciclar-caja="${l.id}">${nombre ?? `C${cn}`}</span>` : '';
      const mods  = l.modificadores?.length ? `<div class="cobro-linea-mods">${l.modificadores.map(m => `└ ${m.nombre_modificador}`).join('  ')}</div>` : '';
      return `<div class="cobro-linea ${dim ? 'dim' : ''}">
        <div class="cobro-linea-main">${badge}<span class="cl-nombre">${l.cantidad}x ${l.nombre_articulo}</span><span class="cl-precio">${fmt(l.subtotal_linea)}</span></div>
        ${mods}</div>`;
    }).join('');
  }

  private _renderCobroTotales(): void {
    const { splitMode, cuentaActivaCobro, orden, cuentasNombres, impuestos } = this._store.state;
    let subtotal: number, impuestoTotal: number, total: number, desgloseHtml = '';
    if (splitMode) {
      const t = this._store.getTotalCuenta(cuentaActivaCobro);
      subtotal = t.subtotal; impuestoTotal = t.impuestos; total = t.total;
      desgloseHtml = t.desglose.map(d => `<div class="cobro-total-row"><span>${d.nombre} ${d.porcentaje}%</span><span class="cobro-total-val">${fmt(d.monto)}</span></div>`).join('');
    } else {
      subtotal = orden?.subtotal ?? 0;
      const desglose = impuestos.map(i => ({ nombre: i.nombre, porcentaje: i.porcentaje, monto: Math.round(subtotal * (i.porcentaje / 100) * 100) / 100 }));
      impuestoTotal = Math.round(desglose.reduce((s, d) => s + d.monto, 0) * 100) / 100;
      total = Math.round((subtotal + impuestoTotal) * 100) / 100;
      desgloseHtml = desglose.map(d => `<div class="cobro-total-row"><span>${d.nombre} ${d.porcentaje}%</span><span class="cobro-total-val">${fmt(d.monto)}</span></div>`).join('');
    }
    const nombre = splitMode ? (cuentasNombres[cuentaActivaCobro] ?? '') : '';
    const label  = splitMode ? `Cuenta ${cuentaActivaCobro}${nombre ? ' — ' + nombre : ''}` : 'TOTAL';
    document.getElementById('cobro-totales')!.innerHTML = `
      <div class="cobro-total-row"><span>Subtotal</span><span class="cobro-total-val">${fmt(subtotal)}</span></div>
      ${desgloseHtml}
      <div class="cobro-total-row grand"><span>${label}</span><span class="cobro-total-val">${fmt(total)}</span></div>`;
  }

  // ─── Pago ─────────────────────────────────────────────────────────────────

  private _renderFormasPago(): void {
    const { formasPago, formaSeleccionada } = this._store.state;
    document.getElementById('formas-pago-grid')!.innerHTML = formasPago.map(f =>
      `<button class="forma-btn ${formaSeleccionada?.id === f.id ? 'selected' : ''}" data-forma="${f.id}">
        <span class="forma-icono">${tipoToFaIcon(f.tipo ?? f.icono ?? '')}</span><span>${f.nombre}</span>
      </button>`).join('');
  }

  private _setMontoPago(): void {
    const input = document.getElementById('monto-pago') as HTMLInputElement;
    if (input) { const p = this._store.getPendiente(); input.value = p > 0 ? String(Math.round(p * 100) / 100) : ''; input.classList.remove('overpay'); }
    const recibido = document.getElementById('monto-recibido') as HTMLInputElement;
    if (recibido) recibido.value = '';
    const preview = document.getElementById('cambio-preview');
    if (preview) preview.style.display = 'none';
  }

  private _updateCambioPreview(): void {
    const recibido = parseFloat((document.getElementById('monto-recibido') as HTMLInputElement)?.value ?? '');
    const aplicar  = parseFloat((document.getElementById('monto-pago') as HTMLInputElement)?.value ?? '');
    const preview  = document.getElementById('cambio-preview');
    const val      = document.getElementById('cambio-preview-val');
    const label    = document.getElementById('cambio-preview-label');
    if (!preview || !val) return;
    if (recibido > 0 && aplicar > 0) {
      const diff = Math.round((recibido - aplicar) * 100) / 100;
      if (Math.abs(diff) > 0.005) {
        val.textContent = fmt(Math.abs(diff));
        if (label) label.textContent = diff > 0 ? 'Cambio:' : 'Falta:';
        preview.style.color = diff < 0 ? 'var(--red)' : '';
        preview.style.display = 'block';
        return;
      }
    }
    preview.style.display = 'none';
  }

  private _renderCobro(): void {
    const pagos     = this._store.getPagosActivos();
    const pendiente = this._store.getPendiente();
    const exceso    = this._store.getCambio();
    const pagado    = this._store.getTotalPagado();
    const total     = this._store.getTotalActivo();
    document.getElementById('pagos-list')!.innerHTML = pagos.map((p, i) =>
      `<div class="pago-item"><button class="pago-remove" data-remove="${i}"><i class="fa-solid fa-xmark"></i></button>
       <span class="pago-nombre">${tipoToFaIcon(p.nombre)} ${p.nombre}</span><span class="pago-monto">${fmt(p.monto)}</span></div>`).join('');
    const exacto = Math.abs(pagado - total) < 0.01;
    let resumenHtml = `<div class="resumen-row"><span class="label">Total</span><span class="val">${fmt(total)}</span></div>
      <div class="resumen-row"><span class="label">Pagado</span><span class="val">${fmt(pagado)}</span></div>`;
    if (pendiente > 0.005)     resumenHtml += `<div class="resumen-row"><span class="label">Falta</span><span class="val pendiente">-${fmt(pendiente)}</span></div>`;
    else if (exceso > 0.005)   resumenHtml += `<div class="resumen-row"><span class="label">Exceso</span><span class="val" style="color:var(--red)">+${fmt(exceso)}</span></div>`;
    else if (pagado > 0)       resumenHtml += `<div class="resumen-row"><span class="label" style="color:var(--green)"><i class="fa-solid fa-circle-check"></i> Exacto</span><span class="val" style="color:var(--green)">${fmt(pagado)}</span></div>`;
    document.getElementById('cobro-resumen')!.innerHTML = resumenHtml;
    const { splitMode, numCuentas, cuentasCobradas, cuentaActivaCobro } = this._store.state;
    const faltanCuentas = splitMode ? Array.from({ length: numCuentas }, (_, i) => i + 1).filter(n => !cuentasCobradas.has(n)).length : 1;
    const btnLabel = splitMode && faltanCuentas > 1 ? `<i class="fa-solid fa-check"></i> Confirmar Cuenta ${cuentaActivaCobro}` : '<i class="fa-solid fa-circle-check"></i> Confirmar cobro';
    const btn = document.getElementById('btn-confirmar') as HTMLButtonElement;
    btn.disabled = isSuperAdmin() ? false : (!exacto || pagado === 0);
    btn.innerHTML = btnLabel;
  }

  // ─── Imprimir cuenta ──────────────────────────────────────────────────────

  private _imprimirCuenta(soloCuenta?: number): void {
    const { orden, mesaLabel, lineas, splitMode, numCuentas, cuentasNombres, ticketId, queue } = this._store.state;
    if (!ticketId) return;
    const ticket   = queue.find(t => t.id === ticketId);
    const numOrden = orden?.numero_orden?.toString().padStart(4, '0') ?? String(ticketId).padStart(4, '0');
    const ahora      = new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
    const digitadoEn = ticket?.timestamp ? new Date(ticket.timestamp).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—';
    const { impuestos: tasas } = this._store.state;

    const fmtLineas = (cn: number | null) => {
      const src = cn == null ? lineas : lineas.filter(l => (l.cuenta_num || 1) === cn);
      return src.map(l => `<tr><td>${l.cantidad}x</td><td>${l.nombre_articulo}${l.modificadores?.length ? '<br><small>' + l.modificadores.map(m => '└ ' + m.nombre_modificador).join(' · ') + '</small>' : ''}</td><td class="r">${fmt(l.subtotal_linea)}</td></tr>`).join('');
    };
    const totales = (cn: number | null) => {
      if (cn == null) {
        const sub = orden?.subtotal ?? 0;
        if (tasas.length) {
          const d = tasas.map(i => ({ nombre: i.nombre, porcentaje: i.porcentaje, monto: Math.round(sub * (i.porcentaje / 100) * 100) / 100 }));
          const imp = Math.round(d.reduce((s, x) => s + x.monto, 0) * 100) / 100;
          return `<tr class="sep"><td colspan="3"></td></tr><tr><td colspan="2">Subtotal</td><td class="r">${fmt(sub)}</td></tr>${d.map(x => `<tr><td colspan="2">${x.nombre} ${x.porcentaje}%</td><td class="r">${fmt(x.monto)}</td></tr>`).join('')}<tr class="grand"><td colspan="2">TOTAL</td><td class="r">${fmt(Math.round((sub + imp) * 100) / 100)}</td></tr>`;
        }
        return `<tr class="sep"><td colspan="3"></td></tr><tr><td colspan="2">Subtotal</td><td class="r">${fmt(sub)}</td></tr><tr class="grand"><td colspan="2">TOTAL</td><td class="r">${fmt(orden?.total ?? 0)}</td></tr>`;
      }
      const t = this._store.getTotalCuenta(cn);
      const impRows = t.desglose.map(d => `<tr><td colspan="2">${d.nombre} ${d.porcentaje}%</td><td class="r">${fmt(d.monto)}</td></tr>`).join('') || `<tr><td colspan="2">Impuestos</td><td class="r">${fmt(t.impuestos)}</td></tr>`;
      return `<tr class="sep"><td colspan="3"></td></tr><tr><td colspan="2">Subtotal</td><td class="r">${fmt(t.subtotal)}</td></tr>${impRows}<tr class="grand"><td colspan="2">Total C${cn}</td><td class="r">${fmt(t.total)}</td></tr>`;
    };

    let cuerpo = '';
    if (soloCuenta != null) {
      cuerpo = `<tr class="cuenta-header"><td colspan="3">Cuenta ${soloCuenta}${cuentasNombres[soloCuenta] ? ' — ' + cuentasNombres[soloCuenta] : ''}</td></tr>${fmtLineas(soloCuenta)}${totales(soloCuenta)}`;
    } else if (splitMode && numCuentas > 1) {
      for (let n = 1; n <= numCuentas; n++) {
        cuerpo += `<tr class="cuenta-header"><td colspan="3">Cuenta ${n}${cuentasNombres[n] ? ' — ' + cuentasNombres[n] : ''}</td></tr>${fmtLineas(n)}${totales(n)}`;
        if (n < numCuentas) cuerpo += '<tr class="cut"><td colspan="3">· · · · · · · · · · · · · · · · · ·</td></tr>';
      }
    } else {
      cuerpo = fmtLineas(null) + totales(null);
    }
    const logoHtml = this._logoEmpresa ? `<img src="${this._logoEmpresa}" alt="logo" style="max-width:80px;max-height:60px;object-fit:contain;display:block;margin:0 auto 6px;">` : '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin:0;padding:0;box-sizing:border-box; } body { font-family:'Courier New',monospace;font-size:12px;color:#000;width:80mm;padding:6mm; } h1 { font-size:18px;text-align:center;margin-bottom:2px; } .sub { text-align:center;font-size:11px;margin-bottom:4px;color:#555; } .sub.sucursal { font-size:13px;font-weight:bold;color:#222;margin-bottom:6px; } .sep-line { border-top:1px dashed #000;margin:6px 0; } table { width:100%;border-collapse:collapse; } td { padding:2px 0;vertical-align:top; } td:first-child { width:26px; } td.r { text-align:right;white-space:nowrap; } .cuenta-header td { font-weight:bold;padding-top:6px;border-bottom:1px solid #000; } tr.sep td { padding:3px 0;border-top:1px dashed #aaa; } tr.grand td { font-weight:bold;font-size:14px;padding-top:4px;border-top:2px solid #000; } tr.cut td { text-align:center;padding:6px 0;color:#aaa; } small { font-size:10px;color:#555; } .footer { text-align:center;margin-top:10px;font-size:11px;color:#555; } @media print { body { width:100%; } }</style></head><body>
      ${logoHtml}${this._nombreEmpresa ? `<h1>${this._nombreEmpresa}</h1>` : '<h1>Serval</h1>'}${this._nombreSucursal ? `<div class="sub sucursal">${this._nombreSucursal}</div>` : ''}
      <div class="sub">Mesa ${mesaLabel}</div><div class="sub" style="font-weight:bold;font-size:13px;">Orden #${numOrden}</div>
      <div class="sub">Digitado: ${digitadoEn}</div><div class="sub">Emisión: ${ahora}</div>
      <div class="sep-line"></div><table><tbody>${cuerpo}</tbody></table><div class="footer">¡Gracias por su visita!</div></body></html>`;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) { toast('Permite las ventanas emergentes para imprimir'); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  // ─── Confirmar cobro ──────────────────────────────────────────────────────

  private _confirmarCobro(): void {
    if (this._store.state.splitMode) {
      const resultado = this._store.confirmarCuentaActiva();
      toast('Cuenta confirmada ✓', 'success');
      if (resultado === 'siguiente') {
        this._persistirPagosEnProceso(); this._renderCuentasTabs(); this._renderCobroLineas();
        this._renderCobroTotales(); this._renderCobro(); this._setMontoPago(); return;
      }
    }
    const recibido = parseFloat((document.getElementById('monto-recibido') as HTMLInputElement)?.value ?? '');
    const aplicar  = parseFloat((document.getElementById('monto-pago') as HTMLInputElement)?.value ?? '');
    const cambio   = Math.round((recibido - aplicar) * 100) / 100;
    if (recibido > 0 && aplicar > 0 && cambio > 0.005) {
      const el = document.getElementById('cambio-amount');
      if (el) el.textContent = fmt(cambio);
      document.getElementById('modal-cambio')!.style.display = 'flex';
      return;
    }
    this._finalizarCobro();
  }

  private _persistirPagosEnProceso(): void {
    const { ticketId, pagos, cuentasCobradas } = this._store.state;
    if (!ticketId) return;
    const queue = this._store.state.queue.map(t =>
      t.id !== ticketId ? t : { ...t, pagosEnProceso: [...pagos], cuentasCobradas: [...cuentasCobradas] });
    this._store.setQueue(queue);
    localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
  }

  private _finalizarCobro(): void {
    document.getElementById('modal-cambio')!.style.display = 'none';
    const { mesaId, ticketId, pagos, orden, impuestos } = this._store.state;
    if (!mesaId || !ticketId) return;
    const subtotalBase = orden?.subtotal ?? 0;
    const desgloseSnapshot = impuestos.map(i => ({
      nombre: i.nombre, porcentaje: i.porcentaje,
      base: subtotalBase,
      monto: Math.round(subtotalBase * (i.porcentaje / 100) * 100) / 100,
    }));
    confirmarCobro(ticketId, pagos, desgloseSnapshot).catch((err: Error) => toast('Error al cobrar: ' + (err?.message ?? 'ver consola'), 'error'));
    removeFromQueue(mesaId);
    mesasChannel.send({ tipo: 'mesa_liberada', mesaId });
    try { localStorage.setItem(MESAS_UPDATE_KEY, JSON.stringify([{ mesaId, estado: 'libre', timestamp: Date.now() }])); } catch { /**/ }
    toast('Cobro registrado ✓', 'success');
    this._store.resetTicket();
    document.getElementById('detalle-content')!.style.display = 'none';
    document.getElementById('detalle-empty')!.style.display   = 'flex';
    document.getElementById('pago-content')!.style.display    = 'none';
    document.getElementById('pago-empty')!.style.display      = 'flex';
    setTimeout(() => this._loadQueue(), 400);
  }

  // ─── Historial / Próximas ─────────────────────────────────────────────────

  private _hoyISO(): string {
    const d = new Date(); const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  private _abrirHistorial(): void {
    const hoy = this._hoyISO();
    const desdeEl = document.getElementById('historial-desde') as HTMLInputElement;
    const hastaEl = document.getElementById('historial-hasta') as HTMLInputElement;
    if (desdeEl && !desdeEl.value) desdeEl.value = hoy;
    if (hastaEl && !hastaEl.value) hastaEl.value = hoy;
    document.getElementById('modal-historial')!.style.display = 'flex';
    if (desdeEl?.value && hastaEl?.value) this._buscarHistorial();
  }
  private _cerrarHistorial(): void { document.getElementById('modal-historial')!.style.display = 'none'; }
  private _abrirProximas(): void { document.getElementById('modal-proximas')!.style.display = 'flex'; this._cargarProximas(); }
  private _cerrarProximas(): void { document.getElementById('modal-proximas')!.style.display = 'none'; }
  private _cargarProximas(): void {
    const bodyEl = document.getElementById('proximas-body')!;
    const refBtn = document.getElementById('btn-refrescar-proximas') as HTMLButtonElement;
    bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;opacity:0.4"></i></div>';
    if (refBtn) refBtn.disabled = true;
    fetchOrdenesProximas(this._sucursalId)
      .then(ordenes => { this._renderProximas(ordenes); })
      .catch(() => { bodyEl.innerHTML = '<div class="historial-empty">Error al cargar.</div>'; })
      .finally(() => { if (refBtn) refBtn.disabled = false; });
  }
  private _renderProximas(ordenes: OrdenProxima[]): void {
    const bodyEl = document.getElementById('proximas-body')!;
    if (!ordenes.length) { bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-utensils" style="font-size:32px;opacity:0.2;margin-bottom:10px"></i><div>No hay órdenes activas</div></div>'; return; }
    bodyEl.innerHTML = ordenes.map(o => {
      const numStr = String(o.numeroOrden).padStart(4, '0');
      const desde  = o.agregadoEn ? tiempoDesde(new Date(o.agregadoEn).getTime()) : '—';
      return `<div class="historial-row"><span class="historial-row-num">#${numStr}</span><span class="historial-row-mesa">${o.mesaLabel}</span><span class="historial-row-hora"><i class="fa-regular fa-clock"></i> ${desde}</span><span class="historial-row-total" style="color:var(--text-muted)">${fmt(o.total)}</span></div>`;
    }).join('');
  }
  private _buscarHistorial(): void {
    const desdeEl  = document.getElementById('historial-desde') as HTMLInputElement;
    const hastaEl  = document.getElementById('historial-hasta') as HTMLInputElement;
    const desde = desdeEl?.value; const hasta = hastaEl?.value;
    if (!desde || !hasta) return;
    const bodyEl   = document.getElementById('historial-body')!;
    const accionEl = document.getElementById('historial-acciones')!;
    const buscarBtn = document.getElementById('btn-buscar-historial') as HTMLButtonElement;
    bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;opacity:0.4"></i></div>';
    accionEl.style.display = 'none'; buscarBtn.disabled = true;
    fetchOrdenesCobradas(this._sucursalId, `${desde} 00:00:00`, `${hasta} 23:59:59`)
      .then(ordenes => { this._historialOrdenes = ordenes; this._renderHistorial(ordenes); })
      .catch(() => { bodyEl.innerHTML = '<div class="historial-empty">Error al cargar. Intenta de nuevo.</div>'; })
      .finally(() => { buscarBtn.disabled = false; });
  }
  private _renderHistorial(ordenes: OrdenDespachada[]): void {
    const bodyEl   = document.getElementById('historial-body')!;
    const accionEl = document.getElementById('historial-acciones')!;
    const countEl  = document.getElementById('historial-count')!;
    const reimpBtn = document.getElementById('btn-reimprimir-todas') as HTMLButtonElement;
    if (!ordenes.length) { bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-receipt" style="font-size:32px;opacity:0.2;margin-bottom:10px"></i><div>Sin órdenes en ese rango</div></div>'; accionEl.style.display = 'none'; return; }
    countEl.textContent = ordenes.length + (ordenes.length === 1 ? ' orden' : ' órdenes');
    reimpBtn.disabled = false; accionEl.style.display = 'flex';
    bodyEl.innerHTML = ordenes.map(o => {
      const hora   = o.fechaCierre ? new Date(o.fechaCierre).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—';
      const numStr = String(o.numeroOrden).padStart(4, '0');
      return `<div class="historial-row"><span class="historial-row-num">#${numStr}</span><span class="historial-row-mesa">${o.mesaLabel}</span><span class="historial-row-hora">${hora}</span><span class="historial-row-total">${fmt(o.total)}</span>
        <button class="btn-reimprimir-uno" data-reimprimir="${o.id}"><i class="fa-solid fa-print"></i> Reimprimir</button></div>`;
    }).join('');
  }
  private async _reimprimirOrdenHistorial(ordenId: number): Promise<void> {
    const orden = this._historialOrdenes.find(o => o.id === ordenId);
    if (!orden) return;
    const lineas = await fetchLineasOrden(ordenId).catch(() => null);
    if (!lineas) { toast('Error al cargar las líneas', 'error'); return; }
    this._generarTicketHistorial([{ orden, lineas }]);
  }
  private async _reimprimirTodasHistorial(): Promise<void> {
    if (!this._historialOrdenes.length) return;
    const btn = document.getElementById('btn-reimprimir-todas') as HTMLButtonElement;
    btn.disabled = true;
    try {
      const datos = await Promise.all(this._historialOrdenes.map(async o => ({ orden: o, lineas: await fetchLineasOrden(o.id).catch(() => [] as LineaCobro[]) })));
      this._generarTicketHistorial(datos);
    } finally { btn.disabled = false; }
  }
  private _generarTicketHistorial(items: Array<{ orden: OrdenDespachada; lineas: LineaCobro[] }>): void {
    const { impuestos: tasas } = this._store.state;
    const logoHtml = this._logoEmpresa ? `<img src="${this._logoEmpresa}" alt="logo" style="max-width:80px;max-height:60px;object-fit:contain;display:block;margin:0 auto 6px;">` : '';
    const ahora = new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
    const ticketsCuerpo = items.map(({ orden, lineas }, idx) => {
      const numOrden  = String(orden.numeroOrden).padStart(4, '0');
      const cobradoEn = orden.fechaCierre ? new Date(orden.fechaCierre).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—';
      const maxCuenta = lineas.reduce((mx, l) => Math.max(mx, l.cuenta_num || 1), 1);
      const fmtLineas = (cn: number | null) => {
        const src = cn == null ? lineas : lineas.filter(l => (l.cuenta_num || 1) === cn);
        return src.map(l => `<tr><td>${l.cantidad}x</td><td>${l.nombre_articulo}</td><td class="r">${fmt(l.subtotal_linea)}</td></tr>`).join('');
      };
      const totalesHTML = (sub: number) => {
        if (tasas.length) {
          const d = tasas.map(i => ({ nombre: i.nombre, porcentaje: i.porcentaje, monto: Math.round(sub * (i.porcentaje / 100) * 100) / 100 }));
          const imp = Math.round(d.reduce((s, x) => s + x.monto, 0) * 100) / 100;
          return `<tr class="sep"><td colspan="3"></td></tr><tr><td colspan="2">Subtotal</td><td class="r">${fmt(sub)}</td></tr>${d.map(x => `<tr><td colspan="2">${x.nombre} ${x.porcentaje}%</td><td class="r">${fmt(x.monto)}</td></tr>`).join('')}<tr class="grand"><td colspan="2">TOTAL</td><td class="r">${fmt(Math.round((sub + imp) * 100) / 100)}</td></tr>`;
        }
        return `<tr class="sep"><td colspan="3"></td></tr><tr><td colspan="2">Subtotal</td><td class="r">${fmt(sub)}</td></tr><tr class="grand"><td colspan="2">TOTAL</td><td class="r">${fmt(orden.total)}</td></tr>`;
      };
      let cuerpo = '';
      if (maxCuenta > 1) {
        for (let n = 1; n <= maxCuenta; n++) {
          const linCuenta = lineas.filter(l => (l.cuenta_num || 1) === n);
          cuerpo += `<tr class="cuenta-header"><td colspan="3">Cuenta ${n}</td></tr>${fmtLineas(n)}${totalesHTML(Math.round(linCuenta.reduce((s, l) => s + l.subtotal_linea, 0) * 100) / 100)}`;
          if (n < maxCuenta) cuerpo += '<tr class="cut"><td colspan="3">· · · · · · · · · · · ·</td></tr>';
        }
      } else { cuerpo = fmtLineas(null) + totalesHTML(orden.subtotal); }
      const sep = idx < items.length - 1 ? '<div class="page-cut"></div>' : '';
      return `<div class="ticket">${logoHtml}${this._nombreEmpresa ? `<h1>${this._nombreEmpresa}</h1>` : '<h1>Serval</h1>'}${this._nombreSucursal ? `<div class="sub sucursal">${this._nombreSucursal}</div>` : ''}<div class="sub">Mesa ${orden.mesaLabel}</div><div class="sub" style="font-weight:bold;font-size:13px;">Orden #${numOrden}</div><div class="sub">Cobrado: ${cobradoEn}</div><div class="sub">Reimpresión: ${ahora}</div><div class="sep-line"></div><table><tbody>${cuerpo}</tbody></table><div class="footer">¡Gracias por su visita!</div></div>${sep}`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>* { margin:0;padding:0;box-sizing:border-box; } body { font-family:'Courier New',monospace;font-size:12px;color:#000;width:80mm;padding:6mm; } h1 { font-size:18px;text-align:center;margin-bottom:2px; } .sub { text-align:center;font-size:11px;margin-bottom:4px;color:#555; } .sub.sucursal { font-size:13px;font-weight:bold;color:#222;margin-bottom:6px; } .sep-line { border-top:1px dashed #000;margin:6px 0; } table { width:100%;border-collapse:collapse; } td { padding:2px 0;vertical-align:top; } td:first-child { width:26px; } td.r { text-align:right;white-space:nowrap; } .cuenta-header td { font-weight:bold;padding-top:6px;border-bottom:1px solid #000; } tr.sep td { padding:3px 0;border-top:1px dashed #aaa; } tr.grand td { font-weight:bold;font-size:14px;padding-top:4px;border-top:2px solid #000; } tr.cut td { text-align:center;padding:6px 0;color:#aaa; } .footer { text-align:center;margin-top:10px;font-size:11px;color:#555; } .page-cut { border-top:2px dashed #aaa;margin:12px 0;page-break-after:always; } @media print { body { width:100%; } .page-cut { page-break-after:always; } }</style></head><body>${ticketsCuerpo}</body></html>`;
    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) { toast('Permite las ventanas emergentes para imprimir'); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  // ─── Split ────────────────────────────────────────────────────────────────

  private _openSplitModal(): void {
    const { ticketId, lineas, numCuentas, cuentasNombres, numComensales, impuestos, mesaLabel } = this._store.state;
    if (!ticketId) return;
    this._splitModal.open({
      mesaLabel: mesaLabel ?? '', lineas: lineas.map(l => ({ ...l, modificadores: (l.modificadores ?? []).map(m => ({ nombre_modificador: m.nombre_modificador })) })),
      numCuentas, cuentasNombres: { ...cuentasNombres }, maxCuentas: Math.max(numComensales || 2, 2), impuestos,
      onConfirm: (result: SplitConfirmResult) => this._aplicarSplitModalResult(result), onCancel: () => {},
    });
  }
  private async _aplicarSplitModalResult(result: SplitConfirmResult): Promise<void> {
    const { ticketId, lineas } = this._store.state;
    if (!ticketId) return;
    this._store.applySplitResult(result);
    result.lineas.forEach(r => { const orig = lineas.find(l => l.id === r.id); if (orig && orig.cuenta_num !== r.cuenta_num) updateLineaCuenta(r.id, r.cuenta_num).catch(() => {}); });
    if (result.desglosadas.length > 0) {
      await Promise.all(result.desglosadas.map(async d => {
        const full = lineas.find(l => l.id === d.originalId); if (!full) return;
        const su = Math.round(full.precio_unitario * 100) / 100;
        await updateLineaCaja(d.originalId, { cantidad: 1, subtotal_linea: su, cuenta_num: d.cuentaNums[0] }).catch(() => {});
        for (let i = 1; i < d.cuentaNums.length; i++) {
          await crearLineaOrden(ticketId, { articulo_id: full.articulo_id, cantidad: 1, precio_unitario: full.precio_unitario, subtotal_linea: su, cuenta_num: d.cuentaNums[i], estado: full.estado, modificadores: full.modificadores.map(m => ({ modificador_id: m.modificador_id, precio_extra: m.precio_extra })) }).catch(() => {});
        }
      }));
      const fresh = await fetchLineasOrden(ticketId).catch(() => null);
      if (fresh) this._store.setLineas(fresh);
    }
    saveCuentasNombres(ticketId, result.cuentasNombres);
    this._actualizarQueueConSplitActual();
    const { splitMode, numCuentas: nc, cuentasNombres: cn, lineas: ls, mesaId } = this._store.state;
    if (mesaId) posSocket.emitSplitActualizado({ orden_id: ticketId, mesa_id: mesaId, split_mode: splitMode, num_cuentas: nc, cuentas_nombres: { ...cn }, lineas: ls.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })) });
    document.getElementById('btn-split-caja')?.classList.toggle('active', splitMode);
    this._renderCuentasTabs(); this._renderCobroLineas(); this._renderCobroTotales(); this._renderCobro(); this._setMontoPago(); this._renderPrintButtons();
  }
  private _actualizarQueueConSplitActual(): void {
    const { ticketId, splitMode, numCuentas, cuentasNombres, lineas } = this._store.state;
    if (!ticketId) return;
    const queue = this._store.state.queue.map(t => t.id !== ticketId ? t : { ...t, splitMode, numCuentas, cuentasNombres });
    this._store.setQueue(queue);
    localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
    cajaChannel.send({ tipo: 'split_actualizado', ordenId: ticketId, splitMode, numCuentas, cuentasNombres, lineas: lineas.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })) });
  }

  // ─── Wiring ───────────────────────────────────────────────────────────────

  private _wireEvents(): void {
    document.getElementById('queue-list')?.addEventListener('click', e => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-ticket]');
      if (card) this._selectTicket(Number(card.dataset.ticket));
    });
    document.getElementById('cuentas-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cuenta]');
      if (!btn) return;
      this._store.selectCuenta(Number(btn.dataset.cuenta));
      this._renderCuentasTabs(); this._renderCobroLineas(); this._renderCobroTotales(); this._renderCobro(); this._setMontoPago();
    });
    document.getElementById('formas-pago-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-forma]');
      if (!btn) return;
      this._store.selectForma(Number(btn.dataset.forma)); this._renderFormasPago();
    });
    document.getElementById('btn-agregar-pago')?.addEventListener('click', () => {
      const input     = document.getElementById('monto-pago') as HTMLInputElement;
      const monto     = Math.round(parseFloat(input.value) * 100) / 100;
      const pendiente = Math.round(this._store.getPendiente() * 100) / 100;
      if (!this._store.state.formaSeleccionada) { toast('Selecciona una forma de pago'); return; }
      if (!monto || monto <= 0)                 { toast('Ingresa un monto válido'); return; }
      if (monto > pendiente + 0.005) { input.classList.add('overpay'); toast(`El monto excede el pendiente (${fmt(pendiente)})`, 'error'); return; }
      input.classList.remove('overpay'); this._store.agregarPago(monto); this._persistirPagosEnProceso(); this._renderCobro(); this._setMontoPago();
    });
    document.getElementById('pagos-list')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-remove]');
      if (!btn) return;
      this._store.eliminarPago(Number(btn.dataset.remove)); this._persistirPagosEnProceso(); this._renderCobro(); this._setMontoPago();
    });
    document.getElementById('monto-recibido')?.addEventListener('input', () => this._updateCambioPreview());
    document.getElementById('monto-pago')?.addEventListener('input', () => this._updateCambioPreview());
    document.getElementById('btn-confirmar')?.addEventListener('click', () => this._confirmarCobro());
    document.getElementById('btn-cerrar-cambio')?.addEventListener('click', () => this._finalizarCobro());
    document.getElementById('print-buttons')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-print-cuenta],[id="btn-imprimir"]');
      if (!btn) return;
      this._imprimirCuenta(btn.dataset.printCuenta != null ? Number(btn.dataset.printCuenta) : undefined);
    });
    document.getElementById('btn-split-caja')?.addEventListener('click', () => this._openSplitModal());
    document.getElementById('cobro-lineas')?.addEventListener('click', e => { if ((e.target as HTMLElement).closest('[data-ciclar-caja]')) this._openSplitModal(); });
    document.getElementById('btn-exit')?.addEventListener('click', () => { posSocket.disconnect(); doLogout(); });
    document.getElementById('btn-proximas')?.addEventListener('click', () => this._abrirProximas());
    document.getElementById('btn-cerrar-proximas')?.addEventListener('click', () => this._cerrarProximas());
    document.getElementById('btn-refrescar-proximas')?.addEventListener('click', () => this._cargarProximas());
    document.getElementById('modal-proximas')?.addEventListener('click', e => { if ((e.target as HTMLElement).id === 'modal-proximas') this._cerrarProximas(); });
    document.getElementById('btn-historial')?.addEventListener('click', () => this._abrirHistorial());
    document.getElementById('btn-cerrar-historial')?.addEventListener('click', () => this._cerrarHistorial());
    document.getElementById('btn-buscar-historial')?.addEventListener('click', () => this._buscarHistorial());
    document.getElementById('btn-reimprimir-todas')?.addEventListener('click', () => this._reimprimirTodasHistorial());
    document.getElementById('historial-body')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-reimprimir]');
      if (btn) this._reimprimirOrdenHistorial(Number(btn.dataset.reimprimir));
    });
    document.getElementById('modal-historial')?.addEventListener('click', e => { if ((e.target as HTMLElement).id === 'modal-historial') this._cerrarHistorial(); });
    document.getElementById('historial-desde')?.addEventListener('keydown', e => { if (e.key === 'Enter') this._buscarHistorial(); });
    document.getElementById('historial-hasta')?.addEventListener('keydown', e => { if (e.key === 'Enter') this._buscarHistorial(); });
    document.getElementById('cuentas-tabs')?.addEventListener('dblclick', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-nombre-cuenta]');
      if (btn) this._abrirModalCuentaNombreCaja(Number(btn.dataset.nombreCuenta));
    });
    document.getElementById('btn-cerrar-cuenta-nombre-caja')?.addEventListener('click', () => this._cerrarModalCuentaNombreCaja());
    document.getElementById('btn-confirmar-cuenta-nombre-caja')?.addEventListener('click', () => this._confirmarCuentaNombreCaja());
    document.getElementById('cuenta-nombre-caja-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._confirmarCuentaNombreCaja();
      if (e.key === 'Escape') this._cerrarModalCuentaNombreCaja();
    });
  }
  private _abrirModalCuentaNombreCaja(num: number): void {
    this._cuentaNombreNum = num;
    const titulo = document.getElementById('cuenta-nombre-caja-titulo');
    if (titulo) titulo.textContent = `Cuenta ${num}`;
    const input = document.getElementById('cuenta-nombre-caja-input') as HTMLInputElement | null;
    if (input) input.value = this._store.state.cuentasNombres[num] ?? '';
    document.getElementById('modal-cuenta-nombre-caja')!.style.display = 'flex';
    setTimeout(() => input?.focus(), 50);
  }
  private _cerrarModalCuentaNombreCaja(): void { document.getElementById('modal-cuenta-nombre-caja')!.style.display = 'none'; }
  private _confirmarCuentaNombreCaja(): void {
    const input = document.getElementById('cuenta-nombre-caja-input') as HTMLInputElement | null;
    this._store.setCuentaNombre(this._cuentaNombreNum, input?.value ?? '');
    saveCuentasNombres(this._store.state.ticketId!, this._store.state.cuentasNombres);
    this._cerrarModalCuentaNombreCaja(); this._renderCuentasTabs(); this._renderCobroLineas(); this._actualizarQueueConSplitActual();
  }
  private _subscribeChannels(): void {
    window.addEventListener('storage', e => { if (e.key === CAJA_QUEUE_KEY) this._loadQueue(); });
    cajaChannel.on(msg => {
      if (msg.tipo === 'split_actualizado') this._aplicarSplitActualizado(msg.ordenId, msg.splitMode, msg.numCuentas, msg.cuentasNombres, msg.lineas);
      else this._loadQueue();
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PedidosTab — gestión de pedidos (mesas + TPV integrado)
// ═══════════════════════════════════════════════════════════════════════════════

class PedidosTab {
  private _sucursalId = 0;

  // Datos cacheados
  private _zonas:    Zona[]    = [];
  private _mesas:    Mesa[]    = [];
  private _familias: Familia[] = [];
  private _articulos: Articulo[] = [];

  // Camareros
  private _camareros:           UsuarioCamarero[] = [];
  private _camareroSeleccionado: UsuarioCamarero | null = null;

  // Estado TPV
  private _mesaActual:        Mesa | null     = null;
  private _modoMostrador                      = false;
  private _ordenActiva:       { id: number; numero_orden: number } | null = null;
  private _lineasExistentes:  LineaOrden[]    = [];
  private _lineasNuevas:      LineaLocal[]    = [];
  private _familiaActiva:     number | null   = null;
  private _lineaSeleccionada: number | null   = null;

  // Flags
  private _datosCargados = false;
  private _cargandoMesa  = false;
  private _enviando      = false;
  private _pidiendo      = false;

  init(sucursalId: number): void {
    this._sucursalId = sucursalId;
    this._wireEvents();
  }

  /** Llamado cuando el tab de pedidos se activa. */
  onActivate(): void {
    if (!this._datosCargados) { this._cargarDatos(); }
    else { this._refrescarMesas(); }
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────

  private _cargarDatos(): void {
    this._setMesasLoading(true);
    Promise.all([
      getFamilias(this._sucursalId).then(f => { this._familias = f; }),
      getAllArticulos().then(a => { this._articulos = a; }),
      this._fetchMesas(),
      getUsuariosStaff(this._sucursalId).then(u => { this._camareros = u; }).catch(() => {}),
    ]).then(() => {
      this._datosCargados = true;
      this._renderMesas();
      this._setMesasLoading(false);
    }).catch(() => { this._setMesasLoading(false); });
  }

  private async _fetchMesas(): Promise<void> {
    const zonas = await getZonas(this._sucursalId);
    this._zonas = zonas;
    const grupos = await Promise.all(zonas.map(z => getMesasByZona(z.id).catch(() => [] as Mesa[])));
    this._mesas = grupos.flat();
  }

  private _refrescarMesas(): void {
    const btn = document.getElementById('btn-refrescar-mesas');
    btn?.classList.add('spinning');
    this._fetchMesas().then(() => { this._renderMesas(); }).catch(() => {}).finally(() => { btn?.classList.remove('spinning'); });
  }

  private _setMesasLoading(loading: boolean): void {
    const list = document.getElementById('p-mesas-list')!;
    if (loading) list.innerHTML = '<div class="p-mesas-loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando mesas…</div>';
  }

  // ─── Render mesas ─────────────────────────────────────────────────────────

  private _renderMesas(): void {
    const list = document.getElementById('p-mesas-list')!;
    if (!this._mesas.length) { list.innerHTML = '<div class="p-mesas-loading">Sin mesas configuradas</div>'; return; }

    const grupos = this._zonas
      .map(z => ({ zona: z, mesas: this._mesas.filter(m => m.zona_id === z.id) }))
      .filter(g => g.mesas.length > 0);

    list.innerHTML = grupos.map(({ zona, mesas }) => `
      <div class="p-zona-label">${zona.nombre}</div>
      ${mesas.map(m => {
        const sel = this._mesaActual?.id === m.id && !this._modoMostrador ? 'selected' : '';
        const tag = m.estado !== 'libre'
          ? `<span class="p-mesa-tag ${m.estado}">${m.estado === 'por_cobrar' ? 'Por cobrar' : 'Ocupada'}</span>`
          : '';
        return `<button class="p-mesa-card ${sel}" data-mesa-id="${m.id}">
          <span class="p-mesa-estado ${m.estado}"></span>
          <span class="p-mesa-nombre">${m.nombre}</span>
          ${tag}
        </button>`;
      }).join('')}
    `).join('');
  }

  // ─── Selección de mesa ────────────────────────────────────────────────────

  private _seleccionarMesa(mesaId: number): void {
    const mesa = this._mesas.find(m => m.id === mesaId);
    if (!mesa || this._cargandoMesa) return;

    this._mesaActual    = mesa;
    this._modoMostrador = false;
    this._limpiarTpv();
    this._renderMesas();
    this._mostrarTpvLoading(`Mesa ${mesa.nombre}`);
    this._cargandoMesa = true;

    getOrdenActivaMesa(mesaId)
      .then(async ordenes => {
        const orden = ordenes[0] ?? null;
        this._ordenActiva = orden ? { id: orden.id, numero_orden: orden.numero_orden } : null;

        if (orden) {
          const lineas = await getLineas(orden.id).catch(() => [] as LineaOrden[]);
          this._lineasExistentes = lineas;
        } else {
          this._lineasExistentes = [];
        }
      })
      .catch(() => { this._ordenActiva = null; this._lineasExistentes = []; })
      .finally(() => {
        this._cargandoMesa = false;
        this._mostrarTpvContenido();
      });
  }

  private _abrirMostrador(): void {
    this._mesaActual    = null;
    this._modoMostrador = true;
    this._limpiarTpv();
    this._renderMesas();
    this._mostrarTpvContenido();
  }

  private _limpiarTpv(): void {
    this._ordenActiva       = null;
    this._lineasExistentes  = [];
    this._lineasNuevas      = [];
    this._lineaSeleccionada = null;
  }

  private _cerrarTpv(): void {
    this._mesaActual    = null;
    this._modoMostrador = false;
    this._limpiarTpv();
    this._renderMesas();
    document.getElementById('p-tpv-empty')!.style.display   = 'flex';
    document.getElementById('p-tpv-content')!.style.display = 'none';
  }

  // ─── Render TPV ───────────────────────────────────────────────────────────

  private _mostrarTpvLoading(label: string): void {
    document.getElementById('p-tpv-empty')!.style.display   = 'none';
    document.getElementById('p-tpv-content')!.style.display = 'flex';
    document.getElementById('p-tpv-destino')!.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px;opacity:0.5"></i>${label}`;
    document.getElementById('p-familias-tabs')!.innerHTML = '';
    document.getElementById('p-articulos-grid')!.innerHTML = '<div class="p-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>';
    document.getElementById('p-orden-lineas')!.innerHTML = '<div class="p-orden-empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:20px;opacity:0.3"></i></div>';
    document.getElementById('p-orden-header')!.style.display = 'none';
    document.getElementById('p-tpv-total')!.style.display = 'none';
    (document.getElementById('p-btn-enviar') as HTMLButtonElement).disabled = true;
    this._clearSearch();
  }

  private _mostrarTpvContenido(): void {
    document.getElementById('p-tpv-empty')!.style.display   = 'none';
    document.getElementById('p-tpv-content')!.style.display = 'flex';
    this._renderTpvHeader();
    this._renderCamareroBtn();
    this._renderFamilias();
    this._renderArticulos();
    this._renderLineas();
  }

  private _renderTpvHeader(): void {
    const el = document.getElementById('p-tpv-destino')!;
    if (this._modoMostrador) {
      el.innerHTML = '<i class="fa-solid fa-cash-register" style="margin-right:6px;color:var(--accent)"></i>Mostrador';
    } else {
      const m = this._mesaActual!;
      const numOrden = this._ordenActiva ? ` · <span style="font-size:12px;color:var(--text-muted);font-family:monospace">Orden #${String(this._ordenActiva.numero_orden).padStart(4,'0')}</span>` : ' · <span style="font-size:12px;color:var(--text-dim)">Sin orden activa</span>';
      el.innerHTML = `<i class="fa-solid fa-chair" style="margin-right:6px;color:var(--accent)"></i>${m.nombre}${numOrden}`;
    }
  }

  private _renderFamilias(): void {
    const el = document.getElementById('p-familias-tabs')!;
    el.innerHTML = [
      `<button class="familia-tab ${this._familiaActiva === null ? 'active' : ''}" data-pfamilia="all">Todo</button>`,
      ...this._familias.map(f => `<button class="familia-tab ${this._familiaActiva === f.id ? 'active' : ''}" data-pfamilia="${f.id}">${f.nombre}</button>`),
    ].join('');
  }

  private static _norm(s: string): string {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private _renderArticulos(search = ''): void {
    const el   = document.getElementById('p-articulos-grid')!;
    const term = PedidosTab._norm(search.trim());
    const base = this._familiaActiva
      ? this._articulos.filter(a => a.familia_id === this._familiaActiva)
      : this._articulos;
    const lista = term ? base.filter(a => PedidosTab._norm(a.nombre).includes(term)) : base;

    if (!lista.length) {
      el.innerHTML = `<div class="p-loading" style="color:var(--text-dim)">${term ? 'Sin resultados' : 'Sin artículos'}</div>`;
      return;
    }
    const iconoGris = `<i class="fa-regular fa-image" style="font-size:32px;color:var(--text-muted)"></i>`;
    el.innerHTML = lista.map(a => {
      const media = a.imagen
        ? `<img src="${a.imagen}" alt="${a.nombre}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${iconoGris.replace('style="', 'style="display:none;')}`
        : iconoGris;
      return `
        <button class="articulo-card" data-particulo="${a.id}">
          <div class="articulo-imagen">${media}</div>
          <div class="articulo-nombre">${a.nombre}</div>
          <div class="articulo-precio">${fmt(a.precio_venta)}</div>
        </button>`;
    }).join('');
  }

  private _renderLineas(): void {
    const elLineas   = document.getElementById('p-orden-lineas')!;
    const headerEl   = document.getElementById('p-orden-header')!;
    const numEl      = document.getElementById('p-orden-header-num')!;
    const infoEl     = document.getElementById('p-orden-header-info')!;
    const totalEl    = document.getElementById('p-tpv-total')!;
    const totalValEl = document.getElementById('p-total-val')!;
    const btnEnviar  = document.getElementById('p-btn-enviar') as HTMLButtonElement;

    const hayLineas    = this._lineasExistentes.length > 0 || this._lineasNuevas.length > 0;
    const btnPedirCta  = document.getElementById('p-btn-pedir-cuenta') as HTMLButtonElement | null;
    if (btnPedirCta) {
      const puedePC = !!this._ordenActiva && this._lineasExistentes.length > 0 && this._lineasNuevas.length === 0;
      btnPedirCta.disabled = !puedePC;
      btnPedirCta.style.display = this._ordenActiva ? 'flex' : 'none';
    }

    // Cabecera de orden (cuando ya existe una orden activa)
    if (this._ordenActiva) {
      headerEl.style.display = 'block';
      numEl.textContent  = 'ORDEN #' + String(this._ordenActiva.numero_orden).padStart(4, '0');
      infoEl.textContent = this._modoMostrador ? 'Mostrador' : `Mesa ${this._mesaActual?.nombre ?? ''}`;
    } else {
      headerEl.style.display = 'none';
    }

    if (!hayLineas) {
      elLineas.innerHTML = `<div class="p-orden-empty"><i class="fa-solid fa-utensils" style="font-size:28px;opacity:0.15"></i><div>Toca un artículo para agregar</div></div>`;
      totalEl.style.display = 'none';
      btnEnviar.disabled = true;
      return;
    }

    // Líneas enviadas (ya en cocina) + nuevas en una sola lista
    const htmlExistentes = this._lineasExistentes.map(l => `
      <div class="p-orden-linea enviada">
        <div class="p-linea-top">
          <span class="p-linea-nombre">${l.cantidad}× ${l.nombre_articulo}</span>
          <span class="p-linea-precio">${fmt(l.subtotal_linea)}</span>
          <span class="p-linea-lock" title="En cocina"><i class="fa-solid fa-fire-burner"></i></span>
        </div>
      </div>`).join('');

    const htmlNuevas = this._lineasNuevas.map((l, i) => {
      const sel = this._lineaSeleccionada === i;
      const controles = sel ? `
        <div class="p-linea-controls">
          <button class="p-qty-btn" data-pdec="${i}">−</button>
          <span class="p-qty-num">${l.cantidad}</span>
          <button class="p-qty-btn" data-pinc="${i}">+</button>
          <button class="p-qty-btn delete" data-premove="${i}"><i class="fa-solid fa-trash"></i></button>
        </div>` : '';
      return `
        <div class="p-orden-linea ${sel ? 'selected' : ''}" data-plinea="${i}">
          <div class="p-linea-top">
            <span class="p-linea-nombre">${l.cantidad}× ${l.nombre}</span>
            <span class="p-linea-precio">${fmt(l.precio * l.cantidad)}</span>
          </div>
          ${controles}
        </div>`;
    }).join('');

    elLineas.innerHTML = htmlExistentes + htmlNuevas;

    const total = Math.round(this._lineasNuevas.reduce((s, l) => s + l.precio * l.cantidad, 0) * 100) / 100;
    if (this._lineasNuevas.length) {
      totalEl.style.display = 'flex';
      totalValEl.textContent = fmt(total);
      btnEnviar.disabled = false;
    } else {
      totalEl.style.display = 'none';
      btnEnviar.disabled = true;
    }
  }

  // ─── Acciones artículos ───────────────────────────────────────────────────

  private _agregarArticulo(articuloId: number): void {
    if (!this._camareroSeleccionado) {
      toast('Asigna un responsable antes de agregar artículos', 'error');
      this._abrirModalCamarero();
      return;
    }
    const a = this._articulos.find(x => x.id === articuloId);
    if (!a) return;
    const idx = this._lineasNuevas.findIndex(l => l.articulo_id === articuloId);
    if (idx >= 0) {
      this._lineasNuevas[idx].cantidad++;
      this._lineaSeleccionada = idx;
    } else {
      this._lineasNuevas.push({ articulo_id: a.id, nombre: a.nombre, precio: Number(a.precio_venta), cantidad: 1 });
      this._lineaSeleccionada = this._lineasNuevas.length - 1;
    }
    this._renderLineas();
  }

  private _cambiarCantidad(idx: number, delta: number): void {
    const l = this._lineasNuevas[idx];
    if (!l) return;
    l.cantidad += delta;
    if (l.cantidad <= 0) {
      this._lineasNuevas.splice(idx, 1);
      this._lineaSeleccionada = null;
    }
    this._renderLineas();
  }

  private _eliminarLinea(idx: number): void {
    this._lineasNuevas.splice(idx, 1);
    this._lineaSeleccionada = null;
    this._renderLineas();
  }

  // ─── Enviar a cocina ──────────────────────────────────────────────────────

  private async _enviarCocina(): Promise<void> {
    if (this._enviando || !this._lineasNuevas.length) return;
    this._enviando = true;
    const btn = document.getElementById('p-btn-enviar') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando…';

    try {
      let ordenId = this._ordenActiva?.id ?? null;

      if (!ordenId) {
        const usuarioId = this._camareroSeleccionado?.id ?? getUser()?.id;
        const data: Record<string, unknown> = {
          sucursal_id:   this._sucursalId,
          usuario_id:    usuarioId,
          tipo_servicio: this._modoMostrador ? 'take_away' : 'mesa',
          estado:        'abierta',
        };
        if (!this._modoMostrador && this._mesaActual) data.mesa_id = this._mesaActual.id;
        const orden = await createOrden(data as Parameters<typeof createOrden>[0]);
        ordenId = orden.id;
        this._ordenActiva = { id: orden.id, numero_orden: orden.numero_orden };
      }

      const nuevasLineas = await Promise.all(
        this._lineasNuevas.map(l =>
          createLinea(ordenId!, {
            articulo_id:     l.articulo_id,
            cantidad:        l.cantidad,
            precio_unitario: l.precio,
            subtotal_linea:  Math.round(l.precio * l.cantidad * 100) / 100,
          }),
        ),
      );

      await marcarOrdenEnPreparacion(ordenId);
      posSocket.emitEnviarCocina(ordenId, nuevasLineas.map(l => l.id));

      // Las nuevas líneas pasan a "existentes" en la UI
      this._lineasExistentes  = [...this._lineasExistentes, ...nuevasLineas];
      this._lineasNuevas      = [];
      this._lineaSeleccionada = null;

      // Actualizar estado de la mesa en la lista
      if (this._mesaActual) {
        const m = this._mesas.find(x => x.id === this._mesaActual!.id);
        if (m) m.estado = 'ocupada';
        this._renderMesas();
      }

      toast('Pedido enviado a cocina ✓', 'success');
      this._renderTpvHeader();
      this._renderLineas();
    } catch (err) {
      console.error('[PedidosTab] Error al enviar:', err);
      toast('Error al enviar el pedido. Intenta de nuevo.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-fire-burner"></i> Enviar a Cocina';
    } finally {
      this._enviando = false;
    }
  }

  // ─── Camarero selector ───────────────────────────────────────────────────

  private _renderCamareroBtn(): void {
    const btn   = document.getElementById('p-camarero-btn');
    const label = document.getElementById('p-camarero-label');
    if (!btn || !label) return;
    if (this._camareroSeleccionado) {
      label.textContent = `${this._camareroSeleccionado.nombre} ${this._camareroSeleccionado.apellido}`.trim();
      btn.classList.add('asignado');
    } else {
      label.textContent = 'Sin asignar';
      btn.classList.remove('asignado');
    }
  }

  private _abrirModalCamarero(): void {
    const listEl = document.getElementById('modal-camarero-list')!;
    const yo = getUser();

    // Yo primero, luego camareros (sin duplicar si yo también soy camarero)
    const yoEntry: UsuarioCamarero | null = yo
      ? { id: yo.id, nombre: `${yo.nombre} (yo)`, apellido: yo.apellido ?? '', roles: [] }
      : null;
    const camareros = this._camareros.filter(c => c.id !== yo?.id);
    const todos: UsuarioCamarero[] = yoEntry ? [yoEntry, ...camareros] : camareros;

    listEl.innerHTML = todos.map(u => {
      const sel = this._camareroSeleccionado?.id === u.id;
      return `<button class="p-camarero-opcion ${sel ? 'selected' : ''}" data-camarero-id="${u.id}">
        <i class="fa-solid fa-user" style="color:var(--text-dim);font-size:12px"></i>
        <span>${u.nombre} ${u.apellido}</span>
        ${sel ? '<i class="fa-solid fa-check" style="margin-left:auto;color:var(--accent)"></i>' : ''}
      </button>`;
    }).join('') || '<div style="padding:12px;color:var(--text-dim);font-size:12px;text-align:center">Sin usuarios disponibles</div>';

    document.getElementById('modal-camarero')!.style.display = 'flex';
  }

  private _cerrarModalCamarero(): void {
    document.getElementById('modal-camarero')!.style.display = 'none';
  }

  private _elegirCamarero(id: number): void {
    const yo = getUser();
    const todos = yo && !this._camareros.some(c => c.id === yo.id)
      ? [{ id: yo.id, nombre: yo.nombre, apellido: yo.apellido ?? '', roles: [] }, ...this._camareros]
      : this._camareros;
    const u = todos.find(c => c.id === id) ?? null;
    this._camareroSeleccionado = u;
    this._renderCamareroBtn();
    this._cerrarModalCamarero();
  }

  // ─── Pedir cuenta ─────────────────────────────────────────────────────────

  private async _pedirCuenta(): Promise<void> {
    if (!this._ordenActiva || this._pidiendo) return;
    if (this._lineasNuevas.length > 0) {
      toast('Tienes artículos sin enviar. Envíalos primero.', 'error'); return;
    }
    this._pidiendo = true;
    const btn = document.getElementById('p-btn-pedir-cuenta') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando…';
    try {
      await marcarOrdenPorCobrar(this._ordenActiva.id);
      toast('Cuenta solicitada — pasó a caja ✓', 'success');
      // Actualizar estado de la mesa localmente
      if (this._mesaActual) {
        const m = this._mesas.find(x => x.id === this._mesaActual!.id);
        if (m) m.estado = 'por_cobrar';
      }
      this._cerrarTpv();
    } catch {
      toast('Error al pedir la cuenta. Intenta de nuevo.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-receipt"></i> Pedir Cuenta';
    } finally {
      this._pidiendo = false;
    }
  }

  private _clearSearch(): void {
    const input   = document.getElementById('p-articulos-search-input') as HTMLInputElement | null;
    const clearBtn = document.getElementById('p-articulos-search-clear') as HTMLElement | null;
    if (input)    input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
  }

  // ─── Wiring ───────────────────────────────────────────────────────────────

  private _wireEvents(): void {
    document.getElementById('btn-mostrador')?.addEventListener('click', () => this._abrirMostrador());
    document.getElementById('btn-refrescar-mesas')?.addEventListener('click', () => this._refrescarMesas());

    document.getElementById('p-mesas-list')?.addEventListener('click', e => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-mesa-id]');
      if (card) this._seleccionarMesa(Number(card.dataset.mesaId));
    });

    document.getElementById('p-btn-cerrar-tpv')?.addEventListener('click', () => this._cerrarTpv());

    document.getElementById('p-familias-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-pfamilia]');
      if (!btn) return;
      const val = btn.dataset.pfamilia;
      this._familiaActiva = val === 'all' ? null : Number(val);
      this._clearSearch();
      this._renderFamilias();
      this._renderArticulos();
    });

    document.getElementById('p-articulos-search-input')?.addEventListener('input', e => {
      const input    = e.target as HTMLInputElement;
      const clearBtn = document.getElementById('p-articulos-search-clear') as HTMLElement | null;
      if (clearBtn) clearBtn.style.display = input.value ? '' : 'none';
      this._renderArticulos(input.value);
    });

    document.getElementById('p-articulos-search-clear')?.addEventListener('click', () => {
      this._clearSearch();
      this._renderArticulos();
    });

    document.getElementById('p-articulos-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-particulo]');
      if (btn) this._agregarArticulo(Number(btn.dataset.particulo));
    });

    document.getElementById('p-orden-lineas')?.addEventListener('click', e => {
      const t      = e.target as HTMLElement;
      const dec    = t.closest<HTMLElement>('[data-pdec]');
      const inc    = t.closest<HTMLElement>('[data-pinc]');
      const remove = t.closest<HTMLElement>('[data-premove]');
      const linea  = t.closest<HTMLElement>('[data-plinea]');
      if (dec)         { this._cambiarCantidad(Number(dec.dataset.pdec), -1); }
      else if (inc)    { this._cambiarCantidad(Number(inc.dataset.pinc), +1); }
      else if (remove) { this._eliminarLinea(Number(remove.dataset.premove)); }
      else if (linea)  {
        const idx = Number(linea.dataset.plinea);
        this._lineaSeleccionada = this._lineaSeleccionada === idx ? null : idx;
        this._renderLineas();
      }
    });

    document.getElementById('p-btn-enviar')?.addEventListener('click', () => this._enviarCocina());
    document.getElementById('p-btn-pedir-cuenta')?.addEventListener('click', () => this._pedirCuenta());

    document.getElementById('p-camarero-btn')?.addEventListener('click', () => this._abrirModalCamarero());
    document.getElementById('btn-cerrar-modal-camarero')?.addEventListener('click', () => this._cerrarModalCamarero());
    document.getElementById('modal-camarero')?.addEventListener('click', e => {
      if ((e.target as HTMLElement).id === 'modal-camarero') this._cerrarModalCamarero();
    });
    document.getElementById('modal-camarero-list')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-camarero-id]');
      if (btn) this._elegirCamarero(Number(btn.dataset.camareroId));
    });

    // Escuchar cambios de estado de mesas por socket
    posSocket.onMesaEstadoCambio(({ mesa_id, estado }) => {
      const m = this._mesas.find(x => x.id === mesa_id);
      if (m) { m.estado = estado; this._renderMesas(); }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ResumenTab — lista de órdenes por rango de fecha + stats
// ═══════════════════════════════════════════════════════════════════════════════

class ResumenTab {
  private _sucursalId = 0;
  private _ordenes: OrdenResumen[] = [];
  private _cargando = false;

  init(sucursalId: number): void {
    this._sucursalId = sucursalId;
    this._setHoy();
    this._wireEvents();
  }

  onActivate(): void {
    this._buscar();
  }

  private _hoyISO(): string {
    const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  private _setHoy(): void {
    const hoy = this._hoyISO();
    (document.getElementById('rs-desde') as HTMLInputElement).value = hoy;
    (document.getElementById('rs-hasta') as HTMLInputElement).value = hoy;
  }

  private async _buscar(): Promise<void> {
    if (this._cargando) return;
    const desde = (document.getElementById('rs-desde') as HTMLInputElement).value;
    const hasta = (document.getElementById('rs-hasta') as HTMLInputElement).value;
    if (!desde || !hasta) { toast('Ingresa un rango de fechas'); return; }

    this._cargando = true;
    const btn = document.getElementById('rs-btn-buscar') as HTMLButtonElement;
    btn.disabled = true;
    this._setListHtml('<div class="rs-empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;opacity:0.3"></i></div>');

    try {
      const [activas, cobradas] = await Promise.all([
        getOrdenesActivas(this._sucursalId),
        getOrdenesCobradas(this._sucursalId, `${desde} 00:00:00`, `${hasta} 23:59:59`),
      ]);
      // Las activas no tienen fecha_cierre; filtrar por agregado_en client-side
      const activasFiltradas = activas.filter(o => {
        if (!o.agregado_en) return true;
        const fecha = o.agregado_en.slice(0, 10);
        return fecha >= desde && fecha <= hasta;
      });
      this._ordenes = [...activasFiltradas, ...cobradas]
        .sort((a, b) => (b.agregado_en ?? '').localeCompare(a.agregado_en ?? ''));
      this._renderStats();
      this._renderLista();
    } catch {
      this._setListHtml('<div class="rs-empty">Error al cargar. Intenta de nuevo.</div>');
    } finally {
      this._cargando = false;
      btn.disabled = false;
    }
  }

  private _renderStats(): void {
    const cobradas   = this._ordenes.filter(o => o.estado === 'cobrada');
    const porCobrar  = this._ordenes.filter(o => o.estado !== 'cobrada');
    const totalCobrado   = Math.round(cobradas.reduce((s, o)  => s + o.total, 0) * 100) / 100;
    const totalPorCobrar = Math.round(porCobrar.reduce((s, o) => s + o.total, 0) * 100) / 100;

    document.getElementById('rs-stat-cobrado')!.textContent   = fmt(totalCobrado);
    document.getElementById('rs-stat-porcobrar')!.textContent = fmt(totalPorCobrar);
    document.getElementById('rs-count-cobrado')!.textContent  = `${cobradas.length} ${cobradas.length === 1 ? 'orden' : 'órdenes'}`;
    document.getElementById('rs-count-porcobrar')!.textContent = `${porCobrar.length} ${porCobrar.length === 1 ? 'orden' : 'órdenes'}`;
  }

  private _renderLista(): void {
    if (!this._ordenes.length) {
      this._setListHtml('<div class="rs-empty"><i class="fa-solid fa-receipt" style="font-size:32px;opacity:0.15;margin-bottom:10px"></i><div>Sin órdenes en ese rango</div></div>');
      return;
    }
    const html = this._ordenes.map(o => {
      const num   = String(o.numero_orden).padStart(4, '0');
      const hora  = o.agregado_en ? new Date(o.agregado_en).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—';
      const total = o.estado === 'cobrada' ? o.total : o.subtotal || o.total;
      const estadoLabel: Record<string, string> = {
        abierta: 'Abierta', preparacion: 'En cocina', por_cobrar: 'Por cobrar', cobrada: 'Cobrada',
      };
      return `<div class="rs-orden-row">
        <span class="rs-orden-num">#${num}</span>
        <span class="rs-orden-mesa">${o.mesa_label}</span>
        <span class="rs-estado-badge ${o.estado}">${estadoLabel[o.estado] ?? o.estado}</span>
        <span class="rs-orden-total">${fmt(total)}</span>
        <span class="rs-orden-hora">${hora}</span>
      </div>`;
    }).join('');
    this._setListHtml(html);
  }

  private _setListHtml(html: string): void {
    document.getElementById('rs-ordenes-list')!.innerHTML = html;
  }

  private _wireEvents(): void {
    document.getElementById('rs-btn-buscar')?.addEventListener('click', () => this._buscar());
    document.getElementById('rs-btn-hoy')?.addEventListener('click', () => { this._setHoy(); this._buscar(); });
    document.getElementById('rs-desde')?.addEventListener('keydown', e => { if (e.key === 'Enter') this._buscar(); });
    document.getElementById('rs-hasta')?.addEventListener('keydown', e => { if (e.key === 'Enter') this._buscar(); });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TabManager — alternancia entre Tab Caja y Tab Pedidos
// ═══════════════════════════════════════════════════════════════════════════════

class TabManager {
  private _pedidosTab: PedidosTab;
  private _resumenTab: ResumenTab;

  constructor(pedidosTab: PedidosTab, resumenTab: ResumenTab) {
    this._pedidosTab = pedidosTab;
    this._resumenTab = resumenTab;
  }

  init(): void {
    document.querySelectorAll<HTMLButtonElement>('.cg-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this._switchTo(btn.dataset.tab as 'caja' | 'pedidos' | 'resumen'));
    });
  }

  private _switchTo(tab: 'caja' | 'pedidos' | 'resumen'): void {
    document.querySelectorAll('.cg-tab-btn').forEach(b => b.classList.toggle('active', (b as HTMLElement).dataset.tab === tab));
    document.getElementById('tab-caja')!.style.display    = tab === 'caja'    ? 'flex' : 'none';
    document.getElementById('tab-pedidos')!.style.display = tab === 'pedidos' ? 'flex' : 'none';
    document.getElementById('tab-resumen')!.style.display = tab === 'resumen' ? 'flex' : 'none';

    const labels: Record<string, string> = { caja: 'Caja', pedidos: 'Pedidos', resumen: 'Resumen' };
    const screenLabel = document.getElementById('topbar-screen-label');
    if (screenLabel) screenLabel.textContent = labels[tab] ?? '';

    if (tab === 'pedidos') this._pedidosTab.onActivate();
    if (tab === 'resumen') this._resumenTab.onActivate();
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (_allowed) {
  const cajaPage   = new CajaPage();
  cajaPage.init();

  const pedidosTab = new PedidosTab();
  pedidosTab.init(cajaPage.getSucursalId());

  const resumenTab = new ResumenTab();
  resumenTab.init(cajaPage.getSucursalId());

  const tabManager = new TabManager(pedidosTab, resumenTab);
  tabManager.init();
}
