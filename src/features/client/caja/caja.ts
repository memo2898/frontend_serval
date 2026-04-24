import { checkRoleAccess, isSuperAdmin } from '@/global/guards_auth';
import { doLogout } from '@/global/logOut';
import { initAdminBubble } from '@/components/admin-bubble/admin-bubble';
const _allowed = checkRoleAccess(['cajero']);
initAdminBubble();

import { SplitModal } from '../shared/components/split-modal';
import type { SplitConfirmResult } from '../shared/components/split-modal';

import { getSucursalId, getUser, getContext } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { fmt, tiempoDesde } from '../shared/utils/format';
import { toast } from '../shared/utils/toast';
import { cajaChannel, mesasChannel, CAJA_QUEUE_KEY, MESAS_UPDATE_KEY } from '../shared/services/pos-channel';
import { posSocket } from '../shared/services/pos-socket';
import { CajaStore } from './caja.store';
import {
  getQueue, removeFromQueue, confirmarCobro, getFormasPago, fetchLineasOrden,
  getSucursalInfo, getImpuestosCaja, tipoToFaIcon, fetchOrdenesEnCola,
  updateLineaCuenta, updateLineaCaja, crearLineaOrden, saveCuentasNombres,
  fetchOrdenesCobradas, fetchOrdenesProximas,
} from './caja.service';
import type { TicketCola, OrdenDespachada, OrdenProxima, LineaCobro } from './caja.types';

// ─── Orchestrador ────────────────────────────────────────────────────────────

class CajaPage {
  private readonly _store      = new CajaStore();
  private readonly _splitModal = new SplitModal();
  private _sucursalId       = 0;
  private _nombreEmpresa    = '';
  private _nombreSucursal   = '';
  private _logoEmpresa      = '';
  private _direccionSucursal = '';
  private _rncEmpresa        = '';
  private _cuentaNombreNum = 0;
  private _historialOrdenes: OrdenDespachada[] = [];

  init(): void {
    this._applyTheme();

    this._sucursalId = getSucursalId();
    if (!this._sucursalId) {
      location.replace(route('/lobby'));
      return;
    }

    const user = getUser();
    const userEl = document.getElementById('topbar-user');
    if (userEl) userEl.textContent = user?.nombre ?? '—';

    // Nombre de sucursal desde el contexto (disponible inmediatamente)
    this._nombreSucursal = getContext()?.nombre_sucursal ?? '';

    // Cargar empresa + logo desde la API
    getSucursalInfo(this._sucursalId).then(info => {
      if (info.empresa?.nombre)            this._nombreEmpresa     = info.empresa.nombre;
      if (info.empresa?.logo)              this._logoEmpresa       = info.empresa.logo;
      if (info.direccion)                  this._direccionSucursal = info.direccion;
      if (info.empresa?.numero_documento)  this._rncEmpresa        = info.empresa.numero_documento;
    }).catch(() => {});

    // Cargar impuestos reales de la sucursal
    getImpuestosCaja(this._sucursalId)
      .then(imp => {
        this._store.setImpuestos(imp);
        // Re-renderizar cola y totales con las tasas correctas
        this._renderQueue();
        if (this._store.state.mesaId !== null) {
          this._renderCobroTotales();
          this._renderCobro();
          this._setMontoPago();
        }
      })
      .catch(err => console.warn('[Caja] No se cargaron impuestos:', err));

    this._loadFormasPago();
    this._loadQueue();
    this._wireEvents();
    this._subscribeChannels();
    this._connectSocket();
  }

  private _applyTheme(): void {
    document.documentElement.style.setProperty('--accent',     '#00904c');
    document.documentElement.style.setProperty('--accent-rgb', '0,144,76');
  }

  // ─── Socket ───────────────────────────────────────────────────────────────

  private _connectSocket(): void {
    import('@/global/session.service').then(({ getToken }) => {
      const tk = getToken();
      if (!tk) return;

      posSocket.connect(tk, this._sucursalId, 'caja');

      // Nueva orden lista para cobrar
      posSocket.onCajaOrdenListaCobrar(({ mesa_id, mesa, orden_id }) => {
        const yaEnCola = this._store.state.queue.some(t => t.mesaId === mesa_id);
        if (!yaEnCola) {
          // Mostrar card provisional mientras llegan los datos reales
          const ticketBasico: TicketCola = {
            id: orden_id, mesaId: mesa_id, mesaLabel: mesa,
            numComensales: 1,
            orden: { id: orden_id, numero_orden: orden_id, mesa_id, estado: 'por_cobrar',
                     subtotal: 0, impuestos_total: 0, total: 0 },
            lineas: [], splitMode: false, numCuentas: 1,
            cuentasNombres: {},
            timestamp: Date.now(),
          };
          this._store.setQueue([...this._store.state.queue, ticketBasico]);
          this._renderQueue();
          toast(`Nueva orden: ${mesa}`, 'success');
        }
        // Siempre sincronizar con la BD para obtener totales y líneas reales
        this._syncFromDB();
      });

      // Artículos entregados al cliente: ahora sí actualizar la cuenta en caja
      posSocket.onKdsLineasEntregadas(({ orden_id }) => {
        const enCola = this._store.state.queue.some(t => t.id === orden_id);
        if (!enCola) return;

        fetchLineasOrden(orden_id)
          .then(lineas => {
            const subtotal = Math.round(lineas.reduce((s, l) => s + l.subtotal_linea, 0) * 100) / 100;

            const queue = this._store.state.queue.map(t =>
              t.id !== orden_id ? t : { ...t, lineas, orden: { ...t.orden, subtotal } },
            );
            this._store.setQueue(queue);
            localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
            this._renderQueue();

            // Si ese ticket está abierto en el detalle, actualizarlo también
            if (this._store.state.ticketId === orden_id) {
              this._store.setLineas(lineas);
              this._renderCobroLineas();
              this._renderCobroTotales();
              this._renderCobro();
              this._setMontoPago();
              this._renderPrintButtons();
            }
          })
          .catch(() => {});
      });

      // Split actualizado por el camarero en tiempo real
      posSocket.onOrdenSplitActualizado(({ orden_id, split_mode, num_cuentas, cuentas_nombres, lineas }) => {
        this._aplicarSplitActualizado(orden_id, split_mode, num_cuentas, cuentas_nombres, lineas);
      });

      // Pago registrado (confirmado por el servidor)
      posSocket.onCajaPagoRegistrado(({ mesa_id }) => {
        if (mesa_id == null) return;
        const enCola = this._store.state.queue.some(t => t.mesaId === mesa_id);
        if (enCola) {
          removeFromQueue(mesa_id);
          this._store.setQueue(getQueue());
          this._renderQueue();
        }
      });

      // Orden anulada
      posSocket.onCajaOrdenAnulada(({ mesa_id }) => {
        removeFromQueue(mesa_id);
        this._store.setQueue(getQueue());
        this._renderQueue();
        toast('Orden anulada');
      });
    });
  }

  // ─── Formas de pago ───────────────────────────────────────────────────────

  private _loadFormasPago(): void {
    getFormasPago()
      .then(formas => {
        this._store.setFormasPago(formas);
        if (this._store.state.mesaId !== null) this._renderFormasPago();
      })
      .catch(() => toast('Error al cargar formas de pago'));
  }

  // ─── Cola ─────────────────────────────────────────────────────────────────

  private _loadQueue(): void {
    // Mostrar el cache local inmediatamente mientras llega la BD
    this._store.setQueue(getQueue());
    this._renderQueue();

    // Sincronizar con BD (fuente de verdad)
    this._syncFromDB();
  }

  private _syncFromDB(): void {
    fetchOrdenesEnCola(this._sucursalId)
      .then(ordenes => {
        // fetchOrdenesEnCola ya deriva splitMode/numCuentas/cuentasNombres desde la BD.
        // Si la sesión activa tiene nombres más recientes (editados en esta sesión), preservarlos.
        const local = this._store.state.queue;
        const merged = ordenes.map(o => {
          const existing = local.find(l => l.id === o.id);
          if (!existing) return o;
          const cuentasNombres = { ...o.cuentasNombres, ...existing.cuentasNombres };
          return {
            ...o,
            cuentasNombres,
            // Preservar progreso de pago en curso (no está en BD hasta cobro total)
            ...(existing.pagosEnProceso?.length  ? { pagosEnProceso:  existing.pagosEnProceso  } : {}),
            ...(existing.cuentasCobradas?.length ? { cuentasCobradas: existing.cuentasCobradas } : {}),
          };
        });
        this._store.setQueue(merged);
        localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(merged));
        this._renderQueue();
      })
      .catch(() => { /* mantener cache local si falla la red */ });
  }

  /** Aplica un split actualizado recibido por socket o BroadcastChannel. */
  private _aplicarSplitActualizado(
    ordenId: number,
    splitMode: boolean,
    numCuentas: number,
    cuentasNombres: Record<number, string>,
    lineas: Array<{ id: number; cuenta_num: number }>,
  ): void {
    const queue = this._store.state.queue.map(t => {
      if (t.id !== ordenId) return t;
      const lineasActualizadas = t.lineas.map(l => {
        const upd = lineas.find(u => u.id === l.id);
        return upd ? { ...l, cuenta_num: upd.cuenta_num } : l;
      });
      return { ...t, splitMode, numCuentas, cuentasNombres, lineas: lineasActualizadas };
    });
    this._store.setQueue(queue);
    localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
    this._renderQueue();

    // Si el ticket activo es el que cambió, actualizarlo en el detalle
    if (this._store.state.ticketId === ordenId) {
      const updated = queue.find(t => t.id === ordenId);
      if (updated) this._store.selectTicket(updated);
      this._renderCuentasTabs();
      this._renderCobroLineas();
      this._renderCobroTotales();
      this._renderCobro();
      this._setMontoPago();
      this._renderPrintButtons();
    }
  }

  private _renderQueue(): void {
    const { queue, mesaId } = this._store.state;
    const listEl  = document.getElementById('queue-list')!;
    const emptyEl = document.getElementById('queue-empty')!;
    const countEl = document.getElementById('queue-count')!;

    if (!queue.length) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'flex';
      countEl.textContent = 'Sin órdenes';
      return;
    }

    emptyEl.style.display = 'none';
    countEl.textContent = queue.length + (queue.length === 1 ? ' orden' : ' órdenes');

    listEl.innerHTML = queue.map(t => {
      const sub    = t.orden?.subtotal ?? 0;
      const tasas  = this._store.state.impuestos;
      const total  = tasas.length
        ? Math.round((sub + tasas.reduce((s, i) => s + Math.round(sub * (i.porcentaje / 100) * 100) / 100, 0)) * 100) / 100
        : (t.orden?.total || sub);
      const items  = t.lineas?.length ?? 0;
      const mins   = Math.floor((Date.now() - t.timestamp) / 60000);
      const tc     = mins >= 20 ? 'late' : mins >= 10 ? 'warn' : 'normal';
      const tLabel = tiempoDesde(t.timestamp);
      const split  = t.splitMode && t.numCuentas > 1
        ? `<span class="queue-split-badge"><i class="fa-solid fa-divide"></i> ${t.numCuentas} cuentas</span>` : '';
      return `
        <div class="queue-card ${t.mesaId === mesaId ? 'selected' : ''}" data-ticket="${t.mesaId}">
          <div class="queue-card-top">
            <span class="queue-mesa">${t.mesaLabel}</span>
            <span class="queue-total">${fmt(total)}</span>
          </div>
          <div class="queue-meta">
            ${t.numComensales || 1} comensal(es) · ${items} artículo(s)
            ${split}
            <span class="queue-timer ${tc}"><i class="fa-regular fa-clock"></i> ${tLabel}</span>
          </div>
        </div>`;
    }).join('');
  }

  private _selectTicket(mesaId: number): void {
    const ticket = this._store.state.queue.find(t => t.mesaId === mesaId);
    if (!ticket) return;
    // Guardar pagos del ticket actual antes de cambiar
    this._persistirPagosEnProceso();
    this._store.selectTicket(ticket);

    // Siempre refrescar líneas desde la BD al seleccionar:
    // garantiza ver artículos agregados después de pedir la cuenta
    fetchLineasOrden(ticket.id)
      .then(lineas => {
        this._store.setLineas(lineas);
        this._renderCobroLineas();
      })
      .catch(() => {});

    this._renderQueue();
    this._renderDetalleHeader();
    this._renderCuentasTabs();
    this._renderCobroLineas();
    this._renderCobroTotales();
    this._renderFormasPago();
    this._renderCobro();
    this._setMontoPago();
    this._renderPrintButtons();

    document.getElementById('detalle-empty')!.style.display   = 'none';
    document.getElementById('detalle-content')!.style.display = 'flex';
    document.getElementById('pago-empty')!.style.display      = 'none';
    document.getElementById('pago-content')!.style.display    = 'flex';

    // Actualizar estado visual del botón de split
    const { splitMode } = this._store.state;
    document.getElementById('btn-split-caja')?.classList.toggle('active', splitMode);
  }

  // ─── Detalle ──────────────────────────────────────────────────────────────

  private _renderDetalleHeader(): void {
    const { orden, mesaLabel, numComensales, splitMode, numCuentas, ticketId } = this._store.state;
    const numEl  = document.getElementById('detalle-num');
    const metaEl = document.getElementById('detalle-meta');
    const numOrden = orden?.numero_orden?.toString().padStart(4, '0') ?? String(ticketId).padStart(4, '0');
    if (numEl)  numEl.textContent  = 'ORDEN #' + numOrden;
    if (metaEl) metaEl.textContent =
      'Mesa ' + mesaLabel + ' · ' + numComensales +
      (numComensales === 1 ? ' comensal' : ' comensales') +
      (splitMode ? ' · ' + numCuentas + ' cuentas' : '');
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
      return `<button class="cuenta-tab ${activa ? 'active' : ''} ${pagada ? 'pagada' : ''}" data-cuenta="${n}" data-nombre-cuenta="${n}" title="Doble click para renombrar">
        ${pagada ? '<i class="fa-solid fa-check"></i> ' : ''}C${n}${nombre} · ${fmt(total)}
      </button>`;
    }).join('');
    this._renderPrintButtons();
  }

  /** Renderiza el/los botón(es) de impresión. Sin split: botón único. Con split: uno por cuenta. */
  private _renderPrintButtons(): void {
    const { splitMode, numCuentas, cuentasNombres } = this._store.state;
    const container = document.getElementById('print-buttons');
    if (!container) return;

    if (!splitMode || numCuentas <= 1) {
      container.innerHTML = `<button class="btn-imprimir" id="btn-imprimir" title="Imprimir cuenta">
        <i class="fa-solid fa-print"></i> Imprimir
      </button>`;
    } else {
      const btns = Array.from({ length: numCuentas }, (_, i) => i + 1).map(n => {
        const nombre = cuentasNombres[n] ? cuentasNombres[n] : `C${n}`;
        return `<button class="btn-imprimir" data-print-cuenta="${n}" title="Imprimir ${nombre}">
          <i class="fa-solid fa-print"></i> ${nombre}
        </button>`;
      }).join('');
      container.innerHTML = btns;
    }
  }

  private _renderCobroLineas(): void {
    const { lineas, splitMode, cuentaActivaCobro, cuentasNombres } = this._store.state;
    const el = document.getElementById('cobro-lineas')!;

    if (!lineas.length) {
      el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">Cargando artículos…</div>';
      return;
    }

    el.innerHTML = lineas.map(l => {
      const cn  = l.cuenta_num || 1;
      const dim = splitMode && cn !== cuentaActivaCobro;
      const bc  = cn <= 3 ? 'c' + cn : 'cX';
      const nombre = cuentasNombres[cn];
      const badgeLabel = nombre ? nombre : `C${cn}`;
      const badge = splitMode
        ? `<span class="cuenta-badge-cobro ${bc}" data-ciclar-caja="${l.id}" title="Click para cambiar cuenta${nombre ? ' · ' + nombre : ''}">${badgeLabel}</span>`
        : '';
      const mods = l.modificadores?.length
        ? `<div class="cobro-linea-mods">${l.modificadores.map(m => `└ ${m.nombre_modificador}`).join('  ')}</div>`
        : '';
      return `
        <div class="cobro-linea ${dim ? 'dim' : ''}">
          <div class="cobro-linea-main">
            ${badge}
            <span class="cl-nombre">${l.cantidad}x ${l.nombre_articulo}</span>
            <span class="cl-precio">${fmt(l.subtotal_linea)}</span>
          </div>
          ${mods}
        </div>`;
    }).join('');
  }

  private _renderCobroTotales(): void {
    const { splitMode, cuentaActivaCobro, orden, cuentasNombres, impuestos } = this._store.state;

    let subtotal: number, impuestoTotal: number, total: number;
    let desgloseHtml = '';

    if (splitMode) {
      const t = this._store.getTotalCuenta(cuentaActivaCobro);
      subtotal     = t.subtotal;
      impuestoTotal = t.impuestos;
      total        = t.total;
      desgloseHtml = t.desglose.map(d =>
        `<div class="cobro-total-row"><span>${d.nombre} ${d.porcentaje}%</span><span class="cobro-total-val">${fmt(d.monto)}</span></div>`
      ).join('');
    } else {
      subtotal = orden?.subtotal ?? 0;
      // Calcular siempre desde el subtotal real de líneas.
      // Si no hay tasas configuradas, el total es el subtotal (sin impuestos).
      const desglose = impuestos.map(i => ({
        nombre:     i.nombre,
        porcentaje: i.porcentaje,
        monto:      Math.round(subtotal * (i.porcentaje / 100) * 100) / 100,
      }));
      impuestoTotal = Math.round(desglose.reduce((s, d) => s + d.monto, 0) * 100) / 100;
      total         = Math.round((subtotal + impuestoTotal) * 100) / 100;
      desgloseHtml  = desglose.map(d =>
        `<div class="cobro-total-row"><span>${d.nombre} ${d.porcentaje}%</span><span class="cobro-total-val">${fmt(d.monto)}</span></div>`
      ).join('');
    }

    const nombre = splitMode ? (cuentasNombres[cuentaActivaCobro] ?? '') : '';
    const label  = splitMode
      ? `Cuenta ${cuentaActivaCobro}${nombre ? ' — ' + nombre : ''}`
      : 'TOTAL';

    document.getElementById('cobro-totales')!.innerHTML = `
      <div class="cobro-total-row"><span>Subtotal</span><span class="cobro-total-val">${fmt(subtotal)}</span></div>
      ${desgloseHtml}
      <div class="cobro-total-row grand"><span>${label}</span><span class="cobro-total-val">${fmt(total)}</span></div>
    `;
  }

  // ─── Pago ─────────────────────────────────────────────────────────────────

  private _renderFormasPago(): void {
    const { formasPago, formaSeleccionada } = this._store.state;
    document.getElementById('formas-pago-grid')!.innerHTML = formasPago.map(f => `
      <button class="forma-btn ${formaSeleccionada?.id === f.id ? 'selected' : ''}" data-forma="${f.id}">
        <span class="forma-icono">${tipoToFaIcon(f.tipo ?? f.icono ?? '')}</span>
        <span>${f.nombre}</span>
      </button>
    `).join('');
  }

  private _setMontoPago(): void {
    const input = document.getElementById('monto-pago') as HTMLInputElement;
    if (input) {
      const pendiente = this._store.getPendiente();
      input.value = pendiente > 0 ? String(Math.round(pendiente * 100) / 100) : '';
      input.classList.remove('overpay');
    }
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
    const exceso    = this._store.getCambio();   // monto pagado de más
    const pagado    = this._store.getTotalPagado();
    const total     = this._store.getTotalActivo();

    document.getElementById('pagos-list')!.innerHTML = pagos.map((p, i) => `
      <div class="pago-item">
        <button class="pago-remove" data-remove="${i}" title="Eliminar">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <span class="pago-nombre">${tipoToFaIcon(p.nombre)} ${p.nombre}</span>
        <span class="pago-monto">${fmt(p.monto)}</span>
      </div>
    `).join('');

    const exacto = Math.abs(pagado - total) < 0.01;
    let resumenHtml = `
      <div class="resumen-row"><span class="label">Total</span><span class="val">${fmt(total)}</span></div>
      <div class="resumen-row"><span class="label">Pagado</span><span class="val">${fmt(pagado)}</span></div>
    `;
    if (pendiente > 0.005) {
      resumenHtml += `<div class="resumen-row"><span class="label">Falta</span><span class="val pendiente">-${fmt(pendiente)}</span></div>`;
    } else if (exceso > 0.005) {
      resumenHtml += `<div class="resumen-row"><span class="label">Exceso</span><span class="val" style="color:var(--red)">+${fmt(exceso)}</span></div>`;
    } else if (pagado > 0) {
      resumenHtml += `<div class="resumen-row"><span class="label" style="color:var(--green)"><i class="fa-solid fa-circle-check"></i> Exacto</span><span class="val" style="color:var(--green)">${fmt(pagado)}</span></div>`;
    }
    document.getElementById('cobro-resumen')!.innerHTML = resumenHtml;

    const { splitMode, numCuentas, cuentasCobradas, cuentaActivaCobro } = this._store.state;
    const faltanCuentas = splitMode
      ? Array.from({ length: numCuentas }, (_, i) => i + 1).filter(n => !cuentasCobradas.has(n)).length
      : 1;
    const btnLabel = splitMode && faltanCuentas > 1
      ? `<i class="fa-solid fa-check"></i> Confirmar Cuenta ${cuentaActivaCobro}`
      : '<i class="fa-solid fa-circle-check"></i> Confirmar cobro';

    const btn = document.getElementById('btn-confirmar') as HTMLButtonElement;
    btn.disabled = isSuperAdmin() ? false : (!exacto || pagado === 0);
    btn.innerHTML = btnLabel;
  }

  // ─── Imprimir cuenta ──────────────────────────────────────────────────────

  private _imprimirCuenta(soloCuenta?: number): void {
    const { orden, mesaLabel, lineas, splitMode, numCuentas, cuentasNombres, ticketId, queue } = this._store.state;
    if (!ticketId) return;

    const ticket     = queue.find(t => t.id === ticketId);
    const numOrden   = orden?.numero_orden?.toString().padStart(4, '0') ?? String(ticketId).padStart(4, '0');
    const ahora      = new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });
    const digitadoEn = ticket?.timestamp
      ? new Date(ticket.timestamp).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
      : '—';

    const fmtLineasCuenta = (cuentaNum: number | null) => {
      const src = cuentaNum == null ? lineas : lineas.filter(l => (l.cuenta_num || 1) === cuentaNum);
      return src.map(l => {
        const mods = l.modificadores?.map(m => `  └ ${m.nombre_modificador}`).join('\n') ?? '';
        return `<tr>
          <td>${l.cantidad}x</td>
          <td>${l.nombre_articulo}${mods ? '<br><small>' + l.modificadores.map(m => '└ ' + m.nombre_modificador).join(' · ') + '</small>' : ''}</td>
          <td class="r">${fmt(l.subtotal_linea)}</td>
        </tr>`;
      }).join('');
    };

    const { impuestos: tasas } = this._store.state;

    const totales = (cuentaNum: number | null) => {
      if (cuentaNum == null) {
        const sub = orden?.subtotal ?? 0;
        let impRows: string, totalFinal: number;
        if (tasas.length) {
          const desglose = tasas.map(i => ({
            nombre: i.nombre, porcentaje: i.porcentaje,
            monto: Math.round(sub * (i.porcentaje / 100) * 100) / 100,
          }));
          const impTotal = Math.round(desglose.reduce((s, d) => s + d.monto, 0) * 100) / 100;
          totalFinal = Math.round((sub + impTotal) * 100) / 100;
          impRows = desglose.map(d =>
            `<tr><td colspan="2">${d.nombre} ${d.porcentaje}%</td><td class="r">${fmt(d.monto)}</td></tr>`
          ).join('');
        } else {
          impRows    = `<tr><td colspan="2">Impuestos</td><td class="r">${fmt(orden?.impuestos_total ?? 0)}</td></tr>`;
          totalFinal = orden?.total ?? 0;
        }
        return `
          <tr class="sep"><td colspan="3"></td></tr>
          <tr><td colspan="2">Subtotal</td><td class="r">${fmt(sub)}</td></tr>
          ${impRows}
          <tr class="grand"><td colspan="2">TOTAL</td><td class="r">${fmt(totalFinal)}</td></tr>`;
      }
      const t = this._store.getTotalCuenta(cuentaNum);
      const impRows = t.desglose.map(d =>
        `<tr><td colspan="2">${d.nombre} ${d.porcentaje}%</td><td class="r">${fmt(d.monto)}</td></tr>`
      ).join('') || `<tr><td colspan="2">Impuestos</td><td class="r">${fmt(t.impuestos)}</td></tr>`;
      return `
        <tr class="sep"><td colspan="3"></td></tr>
        <tr><td colspan="2">Subtotal</td><td class="r">${fmt(t.subtotal)}</td></tr>
        ${impRows}
        <tr class="grand"><td colspan="2">Total C${cuentaNum}</td><td class="r">${fmt(t.total)}</td></tr>`;
    };

    let cuerpo = '';
    if (soloCuenta != null) {
      // Imprimir solo una cuenta individual
      const nombre = cuentasNombres[soloCuenta] ? ` — ${cuentasNombres[soloCuenta]}` : '';
      cuerpo += `<tr class="cuenta-header"><td colspan="3">Cuenta ${soloCuenta}${nombre}</td></tr>`;
      cuerpo += fmtLineasCuenta(soloCuenta);
      cuerpo += totales(soloCuenta);
    } else if (splitMode && numCuentas > 1) {
      // Imprimir todas las cuentas con separadores
      for (let n = 1; n <= numCuentas; n++) {
        const nombre = cuentasNombres[n] ? ` — ${cuentasNombres[n]}` : '';
        cuerpo += `<tr class="cuenta-header"><td colspan="3">Cuenta ${n}${nombre}</td></tr>`;
        cuerpo += fmtLineasCuenta(n);
        cuerpo += totales(n);
        if (n < numCuentas) cuerpo += '<tr class="cut"><td colspan="3">· · · · · · · · · · · · · · · · · ·</td></tr>';
      }
    } else {
      cuerpo = fmtLineasCuenta(null) + totales(null);
    }

    const logoHtml = this._logoEmpresa
      ? `<img src="${this._logoEmpresa}" alt="logo" style="max-width:80px;max-height:60px;object-fit:contain;display:block;margin:0 auto 6px;">`
      : '';
    const empresaHtml = this._nombreEmpresa
      ? `<h1>${this._nombreEmpresa}</h1>`
      : '<h1>Serval</h1>';
    const sucursalHtml = this._nombreSucursal
      ? `<div class="sub sucursal">${this._nombreSucursal}</div>`
      : '';
    const direccionHtml = this._direccionSucursal
      ? `<div class="sub">${this._direccionSucursal}</div>`
      : '';
    const rncHtml = this._rncEmpresa
      ? `<div class="sub">RNC: ${this._rncEmpresa}</div>`
      : '';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Cuenta Mesa ${mesaLabel}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 80mm; padding: 6mm; }
      h1 { font-size: 18px; text-align: center; margin-bottom: 2px; }
      .sub { text-align: center; font-size: 11px; margin-bottom: 4px; color: #555; }
      .sub.sucursal { font-size: 13px; font-weight: bold; color: #222; margin-bottom: 6px; }
      .sep-line { border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      td:first-child { width: 26px; }
      td.r { text-align: right; white-space: nowrap; }
      .cuenta-header td { font-weight: bold; padding-top: 6px; border-bottom: 1px solid #000; }
      tr.sep td { padding: 3px 0; border-top: 1px dashed #aaa; }
      tr.grand td { font-weight: bold; font-size: 14px; padding-top: 4px; border-top: 2px solid #000; }
      tr.cut td { text-align: center; padding: 6px 0; color: #aaa; }
      small { font-size: 10px; color: #555; }
      .footer { text-align: center; margin-top: 10px; font-size: 11px; color: #555; }
      .propina-section { margin-top: 12px; }
      .propina-section .label { font-size: 11px; margin-bottom: 6px; }
      .propina-section .linea { border-bottom: 1px solid #000; margin: 8px 0; height: 18px; }
      @media print { body { width: 100%; } }
    </style></head><body>
    ${logoHtml}
    ${empresaHtml}
    ${sucursalHtml}
    ${direccionHtml}
    ${rncHtml}
    <div class="sub">Mesa ${mesaLabel}</div>
    <div class="sub" style="font-weight:bold;font-size:13px;">Orden #${numOrden}</div>
    <div class="sub">Digitado: ${digitadoEn}</div>
    <div class="sub">Emisión: ${ahora}</div>
    <div class="sep-line"></div>
    <table><tbody>${cuerpo}</tbody></table>
    <div class="footer">¡Gracias por su visita!</div>
    <div class="propina-section">
      <div class="sep-line"></div>
      <div class="label">Propina adicional (opcional):</div>
      <div class="linea"></div>
      <div class="label" style="margin-top:8px;">Firma:</div>
      <div class="linea"></div>
    </div>
    </body></html>`;

    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) { toast('Permite las ventanas emergentes para imprimir'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  // ─── Confirmar cobro ──────────────────────────────────────────────────────

  private _confirmarCobro(): void {
    const { splitMode } = this._store.state;
    if (splitMode) {
      const resultado = this._store.confirmarCuentaActiva();
      toast('Cuenta confirmada ✓', 'success');
      if (resultado === 'siguiente') {
        this._persistirPagosEnProceso();
        this._renderCuentasTabs();
        this._renderCobroLineas();
        this._renderCobroTotales();
        this._renderCobro();
        this._setMontoPago();
        return;
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
      t.id !== ticketId ? t : {
        ...t,
        pagosEnProceso: [...pagos],
        cuentasCobradas: [...cuentasCobradas],
      }
    );
    this._store.setQueue(queue);
    localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
  }

  private _finalizarCobro(): void {
    document.getElementById('modal-cambio')!.style.display = 'none';

    const { mesaId, ticketId, pagos, orden, impuestos } = this._store.state;
    if (!mesaId || !ticketId) return;

    confirmarCobro(ticketId, pagos)
      .catch((err: Error) => {
        console.error('[Caja] Error al cobrar:', err?.message ?? err);
        toast('Error al cobrar: ' + (err?.message ?? 'ver consola'), 'error');
      });

    removeFromQueue(mesaId);
    mesasChannel.send({ tipo: 'mesa_liberada', mesaId });
    try {
      localStorage.setItem(MESAS_UPDATE_KEY, JSON.stringify([
        { mesaId, estado: 'libre', timestamp: Date.now() },
      ]));
    } catch { /* ignorar */ }

    toast('Cobro registrado ✓', 'success');
    this._store.resetTicket();

    document.getElementById('detalle-content')!.style.display = 'none';
    document.getElementById('detalle-empty')!.style.display   = 'flex';
    document.getElementById('pago-content')!.style.display    = 'none';
    document.getElementById('pago-empty')!.style.display      = 'flex';

    setTimeout(() => this._loadQueue(), 400);
  }

  // ─── Historial de órdenes despachadas ────────────────────────────────────

  private _hoyISO(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
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

  private _cerrarHistorial(): void {
    document.getElementById('modal-historial')!.style.display = 'none';
  }

  // ─── Próximas órdenes ─────────────────────────────────────────────────────

  private _abrirProximas(): void {
    document.getElementById('modal-proximas')!.style.display = 'flex';
    this._cargarProximas();
  }

  private _cerrarProximas(): void {
    document.getElementById('modal-proximas')!.style.display = 'none';
  }

  private _cargarProximas(): void {
    const bodyEl  = document.getElementById('proximas-body')!;
    const refBtn  = document.getElementById('btn-refrescar-proximas') as HTMLButtonElement;
    bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;opacity:0.4"></i></div>';
    if (refBtn) refBtn.disabled = true;

    fetchOrdenesProximas(this._sucursalId)
      .then(ordenes => {
        this._renderProximas(ordenes);
      })
      .catch(() => {
        bodyEl.innerHTML = '<div class="historial-empty">Error al cargar las órdenes.</div>';
      })
      .finally(() => { if (refBtn) refBtn.disabled = false; });
  }

  private _renderProximas(ordenes: OrdenProxima[]): void {
    const bodyEl = document.getElementById('proximas-body')!;
    if (!ordenes.length) {
      bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-utensils" style="font-size:32px;opacity:0.2;margin-bottom:10px"></i><div>No hay órdenes activas en este momento</div></div>';
      return;
    }
    bodyEl.innerHTML = ordenes.map(o => {
      const numStr = String(o.numeroOrden).padStart(4, '0');
      const desde  = o.agregadoEn ? tiempoDesde(new Date(o.agregadoEn).getTime()) : '—';
      return `<div class="historial-row">
        <span class="historial-row-num">#${numStr}</span>
        <span class="historial-row-mesa">${o.mesaLabel}</span>
        <span class="historial-row-hora"><i class="fa-regular fa-clock"></i> ${desde}</span>
        <span class="historial-row-total" style="color:var(--text-muted)">${fmt(o.total)}</span>
      </div>`;
    }).join('');
  }

  private _buscarHistorial(): void {
    const desdeEl = document.getElementById('historial-desde') as HTMLInputElement;
    const hastaEl = document.getElementById('historial-hasta') as HTMLInputElement;
    const desde = desdeEl?.value;
    const hasta = hastaEl?.value;
    if (!desde || !hasta) { return; }

    const bodyEl   = document.getElementById('historial-body')!;
    const accionEl = document.getElementById('historial-acciones')!;
    const buscarBtn = document.getElementById('btn-buscar-historial') as HTMLButtonElement;

    bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;opacity:0.4"></i></div>';
    accionEl.style.display = 'none';
    buscarBtn.disabled = true;

    const desdeStr = `${desde} 00:00:00`;
    const hastaStr = `${hasta} 23:59:59`;

    fetchOrdenesCobradas(this._sucursalId, desdeStr, hastaStr)
      .then(ordenes => {
        this._historialOrdenes = ordenes;
        this._renderHistorial(ordenes);
      })
      .catch(() => {
        bodyEl.innerHTML = '<div class="historial-empty">Error al cargar las órdenes. Intenta de nuevo.</div>';
      })
      .finally(() => { buscarBtn.disabled = false; });
  }

  private _renderHistorial(ordenes: OrdenDespachada[]): void {
    const bodyEl    = document.getElementById('historial-body')!;
    const accionEl  = document.getElementById('historial-acciones')!;
    const countEl   = document.getElementById('historial-count')!;
    const reimpBtn  = document.getElementById('btn-reimprimir-todas') as HTMLButtonElement;

    if (!ordenes.length) {
      bodyEl.innerHTML = '<div class="historial-empty"><i class="fa-solid fa-receipt" style="font-size:32px;opacity:0.2;margin-bottom:10px"></i><div>Sin órdenes en ese rango de fechas</div></div>';
      accionEl.style.display = 'none';
      return;
    }

    countEl.textContent = ordenes.length + (ordenes.length === 1 ? ' orden' : ' órdenes');
    reimpBtn.disabled = false;
    accionEl.style.display = 'flex';

    bodyEl.innerHTML = ordenes.map(o => {
      const hora = o.fechaCierre
        ? new Date(o.fechaCierre).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
        : '—';
      const numStr = String(o.numeroOrden).padStart(4, '0');
      return `<div class="historial-row" data-orden-id="${o.id}">
        <span class="historial-row-num">#${numStr}</span>
        <span class="historial-row-mesa">${o.mesaLabel}</span>
        <span class="historial-row-hora">${hora}</span>
        <span class="historial-row-total">${fmt(o.total)}</span>
        <button class="btn-reimprimir-uno" data-reimprimir="${o.id}" title="Reimprimir esta orden">
          <i class="fa-solid fa-print"></i> Reimprimir
        </button>
      </div>`;
    }).join('');
  }

  private async _reimprimirOrdenHistorial(ordenId: number): Promise<void> {
    const orden = this._historialOrdenes.find(o => o.id === ordenId);
    if (!orden) return;
    const lineas = await fetchLineasOrden(ordenId).catch(() => null);
    if (!lineas) { toast('Error al cargar las líneas de la orden', 'error'); return; }
    this._generarTicketHistorial([{ orden, lineas }]);
  }

  private async _reimprimirTodasHistorial(): Promise<void> {
    if (!this._historialOrdenes.length) return;
    const reimpBtn = document.getElementById('btn-reimprimir-todas') as HTMLButtonElement;
    reimpBtn.disabled = true;
    try {
      const datos = await Promise.all(
        this._historialOrdenes.map(async o => ({
          orden:  o,
          lineas: await fetchLineasOrden(o.id).catch(() => [] as LineaCobro[]),
        })),
      );
      this._generarTicketHistorial(datos);
    } finally {
      reimpBtn.disabled = false;
    }
  }

  private _generarTicketHistorial(items: Array<{ orden: OrdenDespachada; lineas: LineaCobro[] }>): void {
    const { impuestos: tasas } = this._store.state;
    const logoHtml     = this._logoEmpresa ? `<img src="${this._logoEmpresa}" alt="logo" style="max-width:80px;max-height:60px;object-fit:contain;display:block;margin:0 auto 6px;">` : '';
    const empresaHtml  = this._nombreEmpresa ? `<h1>${this._nombreEmpresa}</h1>` : '<h1>Serval</h1>';
    const sucursalHtml = this._nombreSucursal ? `<div class="sub sucursal">${this._nombreSucursal}</div>` : '';
    const direccionHtml = this._direccionSucursal ? `<div class="sub">${this._direccionSucursal}</div>` : '';
    const rncHtml       = this._rncEmpresa ? `<div class="sub">RNC: ${this._rncEmpresa}</div>` : '';
    const ahora = new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });

    const ticketsCuerpo = items.map(({ orden, lineas }, idx) => {
      const numOrden    = String(orden.numeroOrden).padStart(4, '0');
      const cobradoEn   = orden.fechaCierre
        ? new Date(orden.fechaCierre).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
        : '—';

      const maxCuenta  = lineas.reduce((mx, l) => Math.max(mx, l.cuenta_num || 1), 1);
      const splitMode  = maxCuenta > 1;

      const fmtLineasCuenta = (cuentaNum: number | null) => {
        const src = cuentaNum == null ? lineas : lineas.filter(l => (l.cuenta_num || 1) === cuentaNum);
        return src.map(l => `<tr>
          <td>${l.cantidad}x</td>
          <td>${l.nombre_articulo}${l.modificadores?.length ? '<br><small>' + l.modificadores.map(m => '└ ' + m.nombre_modificador).join(' · ') + '</small>' : ''}</td>
          <td class="r">${fmt(l.subtotal_linea)}</td>
        </tr>`).join('');
      };

      const totalesHTML = (sub: number) => {
        if (tasas.length) {
          const desglose = tasas.map(i => ({ nombre: i.nombre, porcentaje: i.porcentaje, monto: Math.round(sub * (i.porcentaje / 100) * 100) / 100 }));
          const impTotal = Math.round(desglose.reduce((s, d) => s + d.monto, 0) * 100) / 100;
          const total    = Math.round((sub + impTotal) * 100) / 100;
          return `<tr class="sep"><td colspan="3"></td></tr>
            <tr><td colspan="2">Subtotal</td><td class="r">${fmt(sub)}</td></tr>
            ${desglose.map(d => `<tr><td colspan="2">${d.nombre} ${d.porcentaje}%</td><td class="r">${fmt(d.monto)}</td></tr>`).join('')}
            <tr class="grand"><td colspan="2">TOTAL</td><td class="r">${fmt(total)}</td></tr>`;
        }
        return `<tr class="sep"><td colspan="3"></td></tr>
          <tr><td colspan="2">Subtotal</td><td class="r">${fmt(sub)}</td></tr>
          <tr class="grand"><td colspan="2">TOTAL</td><td class="r">${fmt(orden.total)}</td></tr>`;
      };

      let cuerpo = '';
      if (splitMode) {
        for (let n = 1; n <= maxCuenta; n++) {
          const linCuenta = lineas.filter(l => (l.cuenta_num || 1) === n);
          const subCuenta = Math.round(linCuenta.reduce((s, l) => s + l.subtotal_linea, 0) * 100) / 100;
          cuerpo += `<tr class="cuenta-header"><td colspan="3">Cuenta ${n}</td></tr>`;
          cuerpo += fmtLineasCuenta(n);
          cuerpo += totalesHTML(subCuenta);
          if (n < maxCuenta) cuerpo += '<tr class="cut"><td colspan="3">· · · · · · · · · · · · · · · · · ·</td></tr>';
        }
      } else {
        cuerpo = fmtLineasCuenta(null) + totalesHTML(orden.subtotal);
      }

      const separator = idx < items.length - 1 ? '<div class="page-cut"></div>' : '';
      return `<div class="ticket">
        ${logoHtml}${empresaHtml}${sucursalHtml}${direccionHtml}${rncHtml}
        <div class="sub">Mesa ${orden.mesaLabel}</div>
        <div class="sub" style="font-weight:bold;font-size:13px;">Orden #${numOrden}</div>
        <div class="sub">Cobrado: ${cobradoEn}</div>
        <div class="sub">Reimpresión: ${ahora}</div>
        <div class="sep-line"></div>
        <table><tbody>${cuerpo}</tbody></table>
        <div class="footer">¡Gracias por su visita!</div>
      </div>${separator}`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reimpresión</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 80mm; padding: 6mm; }
      h1 { font-size: 18px; text-align: center; margin-bottom: 2px; }
      .sub { text-align: center; font-size: 11px; margin-bottom: 4px; color: #555; }
      .sub.sucursal { font-size: 13px; font-weight: bold; color: #222; margin-bottom: 6px; }
      .sep-line { border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; }
      td:first-child { width: 26px; }
      td.r { text-align: right; white-space: nowrap; }
      .cuenta-header td { font-weight: bold; padding-top: 6px; border-bottom: 1px solid #000; }
      tr.sep td { padding: 3px 0; border-top: 1px dashed #aaa; }
      tr.grand td { font-weight: bold; font-size: 14px; padding-top: 4px; border-top: 2px solid #000; }
      tr.cut td { text-align: center; padding: 6px 0; color: #aaa; }
      small { font-size: 10px; color: #555; }
      .footer { text-align: center; margin-top: 10px; font-size: 11px; color: #555; }
      .page-cut { border-top: 2px dashed #aaa; margin: 12px 0; page-break-after: always; }
      @media print { body { width: 100%; } .page-cut { page-break-after: always; } }
    </style></head><body>${ticketsCuerpo}</body></html>`;

    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) { toast('Permite las ventanas emergentes para imprimir'); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  // ─── Wiring ───────────────────────────────────────────────────────────────

  // ─── Abrir modal de división ─────────────────────────────────────────────────

  private _openSplitModal(): void {
    const { ticketId, lineas, numCuentas, cuentasNombres, numComensales, impuestos, mesaLabel } = this._store.state;
    if (!ticketId) return;

    this._splitModal.open({
      mesaLabel: mesaLabel ?? '',
      lineas: lineas.map(l => ({ ...l, modificadores: (l.modificadores ?? []).map(m => ({ nombre_modificador: m.nombre_modificador })) })),
      numCuentas,
      cuentasNombres: { ...cuentasNombres },
      maxCuentas: Math.max(numComensales || 2, 2),
      impuestos,
      onConfirm: (result: SplitConfirmResult) => this._aplicarSplitModalResult(result),
      onCancel: () => {},
    });
  }

  private async _aplicarSplitModalResult(result: SplitConfirmResult): Promise<void> {
    const { ticketId, lineas } = this._store.state;
    if (!ticketId) return;

    // 1. Aplicar al store (actualiza lineas, splitMode, numCuentas, cuentasNombres)
    this._store.applySplitResult(result);

    // 2. Persistir en BD: solo las líneas cuyo cuenta_num cambió
    const original = lineas;
    result.lineas.forEach(r => {
      const orig = original.find(l => l.id === r.id);
      if (orig && orig.cuenta_num !== r.cuenta_num) {
        updateLineaCuenta(r.id, r.cuenta_num).catch(() => {});
      }
    });

    // 3. Manejar desgloses: partir líneas agrupadas en unidades individuales
    if (result.desglosadas.length > 0) {
      await Promise.all(result.desglosadas.map(async d => {
        const full = original.find(l => l.id === d.originalId);
        if (!full) return;
        const subtotalUnit = Math.round(full.precio_unitario * 100) / 100;

        await updateLineaCaja(d.originalId, {
          cantidad:       1,
          subtotal_linea: subtotalUnit,
          cuenta_num:     d.cuentaNums[0],
        }).catch(() => {});

        for (let i = 1; i < d.cuentaNums.length; i++) {
          await crearLineaOrden(ticketId, {
            articulo_id:     full.articulo_id,
            cantidad:        1,
            precio_unitario: full.precio_unitario,
            subtotal_linea:  subtotalUnit,
            cuenta_num:      d.cuentaNums[i],
            estado:          full.estado,
            modificadores:   full.modificadores.map(m => ({ modificador_id: m.modificador_id, precio_extra: m.precio_extra })),
          }).catch(() => {});
        }
      }));

      // Recargar líneas desde servidor para obtener IDs reales de las nuevas líneas
      const freshLineas = await fetchLineasOrden(ticketId).catch(() => null);
      if (freshLineas) {
        this._store.setLineas(freshLineas);
      }
    }

    // 4. Guardar nombres en localStorage
    saveCuentasNombres(ticketId, result.cuentasNombres);

    // 5. Actualizar cola local + BroadcastChannel
    this._actualizarQueueConSplitActual();

    // 6. Emitir socket para sincronizar con el camarero
    const { splitMode, numCuentas: nc, cuentasNombres: cn, lineas: ls, mesaId } = this._store.state;
    if (mesaId) {
      posSocket.emitSplitActualizado({
        orden_id:        ticketId,
        mesa_id:         mesaId,
        split_mode:      splitMode,
        num_cuentas:     nc,
        cuentas_nombres: { ...cn },
        lineas:          ls.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })),
      });
    }

    // 7. Actualizar visual del botón
    document.getElementById('btn-split-caja')?.classList.toggle('active', splitMode);

    // 8. Re-renderizar
    this._renderCuentasTabs();
    this._renderCobroLineas();
    this._renderCobroTotales();
    this._renderCobro();
    this._setMontoPago();
    this._renderPrintButtons();
  }

  /** Persiste el split actual del ticket activo en la cola local y emite por BroadcastChannel. */
  private _actualizarQueueConSplitActual(): void {
    const { ticketId, splitMode, numCuentas, cuentasNombres, lineas } = this._store.state;
    if (!ticketId) return;
    const queue = this._store.state.queue.map(t =>
      t.id !== ticketId ? t : { ...t, splitMode, numCuentas, cuentasNombres }
    );
    this._store.setQueue(queue);
    localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
    const splitPayload = {
      tipo: 'split_actualizado' as const,
      ordenId: ticketId,
      splitMode,
      numCuentas,
      cuentasNombres,
      lineas: lineas.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })),
    };
    // Notificar a otras instancias de caja (mismo dispositivo)
    cajaChannel.send(splitPayload);
    // Notificar al módulo mesas (mismo dispositivo, distinta pestaña)
    mesasChannel.send(splitPayload);
  }

  private _wireEvents(): void {
    document.getElementById('queue-list')?.addEventListener('click', e => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-ticket]');
      if (card) this._selectTicket(Number(card.dataset.ticket));
    });

    document.getElementById('cuentas-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cuenta]');
      if (!btn) return;
      this._store.selectCuenta(Number(btn.dataset.cuenta));
      this._renderCuentasTabs();
      this._renderCobroLineas();
      this._renderCobroTotales();
      this._renderCobro();
      this._setMontoPago();
    });

    document.getElementById('formas-pago-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-forma]');
      if (!btn) return;
      this._store.selectForma(Number(btn.dataset.forma));
      this._renderFormasPago();
    });

    document.getElementById('btn-agregar-pago')?.addEventListener('click', () => {
      const input     = document.getElementById('monto-pago') as HTMLInputElement;
      const monto     = Math.round(parseFloat(input.value) * 100) / 100;
      const pendiente = Math.round(this._store.getPendiente() * 100) / 100;
      if (!this._store.state.formaSeleccionada) { toast('Selecciona una forma de pago'); return; }
      if (!monto || monto <= 0)                 { toast('Ingresa un monto válido'); return; }
      if (monto > pendiente + 0.005) {
        input.classList.add('overpay');
        toast(`El monto excede el pendiente (${fmt(pendiente)})`, 'error');
        return;
      }
      input.classList.remove('overpay');
      this._store.agregarPago(monto);
      this._persistirPagosEnProceso();
      this._renderCobro();
      this._setMontoPago();
    });

    document.getElementById('pagos-list')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-remove]');
      if (!btn) return;
      const idx = Number(btn.dataset.remove);
      this._store.eliminarPago(idx);
      this._persistirPagosEnProceso();
      this._renderCobro();
      this._setMontoPago();
    });

    document.getElementById('monto-recibido')?.addEventListener('input', () => this._updateCambioPreview());
    document.getElementById('monto-pago')?.addEventListener('input', () => this._updateCambioPreview());
    document.getElementById('btn-confirmar')?.addEventListener('click', () => this._confirmarCobro());
    document.getElementById('btn-cerrar-cambio')?.addEventListener('click', () => this._finalizarCobro());

    // Botón(es) de impresión — delegado en container porque son dinámicos
    document.getElementById('print-buttons')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-print-cuenta],[id="btn-imprimir"]');
      if (!btn) return;
      const cn = btn.dataset.printCuenta;
      this._imprimirCuenta(cn != null ? Number(cn) : undefined);
    });

    // Botón dividir cuenta en caja → abre el modal de edición staged
    document.getElementById('btn-split-caja')?.addEventListener('click', () => this._openSplitModal());

    // Badges en cobro-lineas son indicadores de solo lectura — la edición se hace en el modal
    // (click en badge abre el modal directamente para mayor comodidad)
    document.getElementById('cobro-lineas')?.addEventListener('click', e => {
      const badge = (e.target as HTMLElement).closest<HTMLElement>('[data-ciclar-caja]');
      if (badge) this._openSplitModal();
    });

    document.getElementById('btn-exit')?.addEventListener('click', () => {
      posSocket.disconnect();
      doLogout();
    });

    // Próximas órdenes
    document.getElementById('btn-proximas')?.addEventListener('click', () => this._abrirProximas());
    document.getElementById('btn-cerrar-proximas')?.addEventListener('click', () => this._cerrarProximas());
    document.getElementById('btn-refrescar-proximas')?.addEventListener('click', () => this._cargarProximas());
    document.getElementById('modal-proximas')?.addEventListener('click', e => {
      if ((e.target as HTMLElement).id === 'modal-proximas') this._cerrarProximas();
    });

    // Historial
    document.getElementById('btn-historial')?.addEventListener('click', () => this._abrirHistorial());
    document.getElementById('btn-cerrar-historial')?.addEventListener('click', () => this._cerrarHistorial());
    document.getElementById('btn-buscar-historial')?.addEventListener('click', () => this._buscarHistorial());
    document.getElementById('btn-reimprimir-todas')?.addEventListener('click', () => this._reimprimirTodasHistorial());
    document.getElementById('historial-body')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-reimprimir]');
      if (btn) this._reimprimirOrdenHistorial(Number(btn.dataset.reimprimir));
    });
    document.getElementById('modal-historial')?.addEventListener('click', e => {
      if ((e.target as HTMLElement).id === 'modal-historial') this._cerrarHistorial();
    });
    document.getElementById('historial-desde')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._buscarHistorial();
    });
    document.getElementById('historial-hasta')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._buscarHistorial();
    });

    // Doble click en tab de cuenta → renombrar
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

  // ─── Modal nombre de cuenta ───────────────────────────────────────────────

  private _abrirModalCuentaNombreCaja(num: number): void {
    this._cuentaNombreNum = num;
    const titulo = document.getElementById('cuenta-nombre-caja-titulo');
    if (titulo) titulo.textContent = `Cuenta ${num}`;
    const input = document.getElementById('cuenta-nombre-caja-input') as HTMLInputElement | null;
    if (input) input.value = this._store.state.cuentasNombres[num] ?? '';
    document.getElementById('modal-cuenta-nombre-caja')!.style.display = 'flex';
    setTimeout(() => input?.focus(), 50);
  }

  private _cerrarModalCuentaNombreCaja(): void {
    document.getElementById('modal-cuenta-nombre-caja')!.style.display = 'none';
  }

  private _confirmarCuentaNombreCaja(): void {
    const input = document.getElementById('cuenta-nombre-caja-input') as HTMLInputElement | null;
    const nombre = input?.value ?? '';
    this._store.setCuentaNombre(this._cuentaNombreNum, nombre);
    saveCuentasNombres(this._store.state.ticketId!, this._store.state.cuentasNombres);
    this._cerrarModalCuentaNombreCaja();
    this._renderCuentasTabs();
    this._renderCobroLineas();
    this._actualizarQueueConSplitActual();
    // Emitir por socket para sincronizar meseros en otros dispositivos
    const { ticketId, mesaId, splitMode, numCuentas, cuentasNombres, lineas } = this._store.state;
    if (ticketId && mesaId) {
      posSocket.emitSplitActualizado({
        orden_id:        ticketId,
        mesa_id:         mesaId,
        split_mode:      splitMode,
        num_cuentas:     numCuentas,
        cuentas_nombres: { ...cuentasNombres },
        lineas:          lineas.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })),
      });
    }
  }

  private _subscribeChannels(): void {
    window.addEventListener('storage', e => {
      if (e.key === CAJA_QUEUE_KEY) this._loadQueue();
    });
    cajaChannel.on(msg => {
      if (msg.tipo === 'split_actualizado') {
        this._aplicarSplitActualizado(
          msg.ordenId, msg.splitMode, msg.numCuentas, msg.cuentasNombres, msg.lineas,
        );
      } else {
        this._loadQueue();
      }
    });
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (_allowed) new CajaPage().init();
