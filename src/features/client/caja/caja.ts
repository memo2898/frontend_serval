import { checkRoleAccess } from '@/global/guards_auth';
import { doLogout } from '@/global/logOut';
const _allowed = checkRoleAccess(['cajero']);

import { getSucursalId } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { fmt, tiempoDesde } from '../shared/utils/format';
import { toast } from '../shared/utils/toast';
import { mesasChannel, CAJA_QUEUE_KEY, MESAS_UPDATE_KEY } from '../shared/services/pos-channel';
import { posSocket } from '../shared/services/pos-socket';
import { CajaStore } from './caja.store';
import { getQueue, removeFromQueue, confirmarCobro, getFormasPago } from './caja.service';
import type { TicketCola } from './caja.types';

// ─── Orchestrador ────────────────────────────────────────────────────────────

class CajaPage {
  private readonly _store = new CajaStore();
  private _sucursalId = 0;

  init(): void {
    this._applyTheme();

    this._sucursalId = getSucursalId();
    if (!this._sucursalId) {
      location.replace(route('/lobby'));
      return;
    }

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
      if (tk) posSocket.connect(tk, this._sucursalId, 'caja');
    });

    // Nueva orden lista para cobrar — el servidor la notifica cuando mesas llama pedir-cuenta
    posSocket.onCajaOrdenListaCobrar(({ mesa_id, mesa_nombre, orden_id, total }) => {
      // Si ya está en la cola local no duplicar
      const yaEnCola = this._store.state.queue.some(t => t.mesaId === mesa_id);
      if (yaEnCola) return;

      // Agregar un ticket básico a la cola para que el cajero lo vea de inmediato
      // (los datos completos vendrán del localStorage o una llamada a la API)
      const ticketBasico: TicketCola = {
        id: orden_id,
        mesaId: mesa_id,
        mesaLabel: mesa_nombre,
        numComensales: 1,
        orden: {
          id: orden_id,
          numero_orden: orden_id,
          mesa_id,
          estado: 'lista',
          subtotal: 0,
          impuestos_total: 0,
          total,
        },
        lineas: [],
        splitMode: false,
        numCuentas: 1,
        timestamp: Date.now(),
      };

      const queue = this._store.state.queue;
      this._store.setQueue([...queue, ticketBasico]);
      this._renderQueue();
      toast(`Nueva orden: Mesa ${mesa_nombre}`, 'success');
    });

    // Pago registrado (confirmado por el servidor)
    posSocket.onCajaPagoRegistrado(({ orden_id, mesa_id }) => {
      // Si este terminal fue el que registró el cobro, ya se procesó localmente
      // Solo actuar si la mesa aún está en cola (otro terminal la cobró)
      const enCola = this._store.state.queue.some(t => t.mesaId === mesa_id);
      if (enCola) {
        removeFromQueue(mesa_id);
        this._store.setQueue(getQueue());
        this._renderQueue();
      }
      void orden_id;
    });

    // Orden anulada
    posSocket.onCajaOrdenAnulada(({ mesa_id }) => {
      removeFromQueue(mesa_id);
      this._store.setQueue(getQueue());
      this._renderQueue();
      toast('Orden anulada');
    });
  }

  // ─── Formas de pago (API real) ────────────────────────────────────────────

  private _loadFormasPago(): void {
    getFormasPago()
      .then(formas => {
        this._store.setFormasPago(formas);
        // Re-render si hay un ticket activo
        if (this._store.state.mesaId !== null) {
          this._renderFormasPago();
        }
      })
      .catch(() => toast('Error al cargar formas de pago'));
  }

  // ─── Cola ─────────────────────────────────────────────────────────────────

  private _loadQueue(): void {
    this._store.setQueue(getQueue());
    this._renderQueue();
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
      const total = t.orden?.total ?? 0;
      const items = t.lineas?.length ?? 0;
      const mins  = Math.floor((Date.now() - t.timestamp) / 60000);
      const tc    = mins >= 20 ? 'late' : mins >= 10 ? 'warn' : 'normal';
      const tLabel = tiempoDesde(t.timestamp);
      return `
        <div class="queue-card ${t.mesaId === mesaId ? 'selected' : ''}" data-ticket="${t.mesaId}">
          <div class="queue-card-top">
            <span class="queue-mesa">Mesa ${t.mesaLabel}</span>
            <span class="queue-total">${fmt(total)}</span>
          </div>
          <div class="queue-meta">
            ${t.numComensales || 1} comensal(es) · ${items} artículo(s)
            <span class="queue-timer ${tc}">⏱ ${tLabel}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  private _selectTicket(mesaId: number): void {
    const ticket = this._store.state.queue.find(t => t.mesaId === mesaId);
    if (!ticket) return;
    this._store.selectTicket(ticket);
    this._renderQueue();
    this._renderDetalleHeader();
    this._renderCuentasTabs();
    this._renderCobroLineas();
    this._renderCobroTotales();
    this._renderFormasPago();
    this._renderCobro();
    this._setMontoPago();

    document.getElementById('detalle-empty')!.style.display  = 'none';
    document.getElementById('detalle-content')!.style.display = 'flex';
    document.getElementById('pago-empty')!.style.display     = 'none';
    document.getElementById('pago-content')!.style.display   = 'flex';
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
    const { splitMode, numCuentas, cuentaActivaCobro, cuentasCobradas } = this._store.state;
    const el = document.getElementById('cuentas-tabs')!;
    if (!splitMode || numCuentas <= 1) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = Array.from({ length: numCuentas }, (_, i) => i + 1).map(n => {
      const { total } = this._store.getTotalCuenta(n);
      const pagada = cuentasCobradas.has(n);
      const activa = n === cuentaActivaCobro && !pagada;
      return `<button class="cuenta-tab ${activa ? 'active' : ''} ${pagada ? 'pagada' : ''}" data-cuenta="${n}">
        ${pagada ? '✓ ' : ''}Cuenta ${n} · ${fmt(total)}
      </button>`;
    }).join('');
  }

  private _renderCobroLineas(): void {
    const { lineas, splitMode, cuentaActivaCobro } = this._store.state;
    const el = document.getElementById('cobro-lineas')!;
    el.innerHTML = lineas.map(l => {
      const cn  = l.cuenta_num || 1;
      const dim = splitMode && cn !== cuentaActivaCobro;
      const bc  = cn <= 3 ? 'c' + cn : 'cX';
      const badge = splitMode ? `<span class="cuenta-badge-cobro ${bc}">C${cn}</span>` : '';
      return `
        <div class="cobro-linea ${dim ? 'dim' : ''}">
          ${badge}
          <span class="cl-nombre">${l.cantidad}x ${l.nombre_articulo}</span>
          <span class="cl-precio">${fmt(l.subtotal_linea)}</span>
        </div>`;
    }).join('');
  }

  private _renderCobroTotales(): void {
    const { splitMode, cuentaActivaCobro, orden } = this._store.state;
    const t = splitMode
      ? this._store.getTotalCuenta(cuentaActivaCobro)
      : {
          subtotal:   orden?.subtotal ?? 0,
          impuestos:  orden?.impuestos_total ?? 0,
          total:      orden?.total ?? 0,
        };
    const label = splitMode ? `Cuenta ${cuentaActivaCobro}` : 'TOTAL';
    document.getElementById('cobro-totales')!.innerHTML = `
      <div class="cobro-total-row"><span>Subtotal</span><span class="cobro-total-val">${fmt(t.subtotal)}</span></div>
      <div class="cobro-total-row"><span>ITBIS 18%</span><span class="cobro-total-val">${fmt(t.impuestos)}</span></div>
      <div class="cobro-total-row grand"><span>${label}</span><span class="cobro-total-val">${fmt(t.total)}</span></div>
    `;
  }

  // ─── Pago ─────────────────────────────────────────────────────────────────

  private _renderFormasPago(): void {
    const { formasPago, formaSeleccionada } = this._store.state;
    document.getElementById('formas-pago-grid')!.innerHTML = formasPago.map(f => `
      <button class="forma-btn ${formaSeleccionada?.id === f.id ? 'selected' : ''}" data-forma="${f.id}">
        <span class="forma-icono">${f.icono ?? '💳'}</span>
        <span>${f.nombre}</span>
      </button>
    `).join('');
  }

  private _setMontoPago(): void {
    const input = document.getElementById('monto-pago') as HTMLInputElement;
    if (input) input.value = String(this._store.getTotalActivo());
  }

  private _renderCobro(): void {
    const pagos     = this._store.getPagosActivos();
    const pendiente = this._store.getPendiente();
    const cambio    = this._store.getCambio();
    const pagado    = this._store.getTotalPagado();

    document.getElementById('pagos-list')!.innerHTML = pagos.map(p => `
      <div class="pago-item">
        <span class="pago-nombre">${p.icono ?? ''} ${p.nombre}</span>
        <span class="pago-monto">${fmt(p.monto)}</span>
      </div>
    `).join('');

    document.getElementById('cobro-resumen')!.innerHTML = `
      <div class="resumen-row"><span class="label">Total pagado</span><span class="val">${fmt(pagado)}</span></div>
      <div class="resumen-row"><span class="label">Pendiente</span><span class="val pendiente">${fmt(pendiente)}</span></div>
      <div class="resumen-row"><span class="label">Cambio</span><span class="val cambio">${fmt(cambio)}</span></div>
    `;

    const { splitMode, numCuentas, cuentasCobradas, cuentaActivaCobro } = this._store.state;
    const faltanCuentas = splitMode
      ? Array.from({ length: numCuentas }, (_, i) => i + 1).filter(n => !cuentasCobradas.has(n)).length
      : 1;
    const btnLabel = splitMode && faltanCuentas > 1
      ? `✓ Confirmar Cuenta ${cuentaActivaCobro}`
      : '✅ Confirmar cobro';

    const btn = document.getElementById('btn-confirmar') as HTMLButtonElement;
    btn.disabled = pendiente > 0;
    btn.textContent = btnLabel;
  }

  // ─── Confirmar ────────────────────────────────────────────────────────────

  private _confirmarCobro(): void {
    const { splitMode } = this._store.state;
    if (splitMode) {
      const resultado = this._store.confirmarCuentaActiva();
      toast('Cuenta confirmada ✓', 'success');
      if (resultado === 'siguiente') {
        this._renderCuentasTabs();
        this._renderCobroLineas();
        this._renderCobroTotales();
        this._renderCobro();
        this._setMontoPago();
        return;
      }
    }

    const cambio = this._store.getCambio();
    if (cambio > 0) {
      document.getElementById('cambio-amount')!.textContent = fmt(cambio);
      document.getElementById('modal-cambio')!.style.display = 'flex';
    } else {
      this._finalizarCobro();
    }
  }

  private _finalizarCobro(): void {
    document.getElementById('modal-cambio')!.style.display = 'none';

    const { mesaId, ticketId, pagos } = this._store.state;
    if (!mesaId || !ticketId) return;

    // Llamada a la API
    confirmarCobro(ticketId, pagos)
      .catch(() => {
        // El cobro ya se registró localmente — no bloquear el flujo
        toast('Advertencia: error al sincronizar cobro con el servidor');
      });

    // Notificar a otros módulos
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
    document.getElementById('detalle-empty')!.style.display  = 'flex';
    document.getElementById('pago-content')!.style.display   = 'none';
    document.getElementById('pago-empty')!.style.display     = 'flex';

    setTimeout(() => this._loadQueue(), 400);
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
      const input = document.getElementById('monto-pago') as HTMLInputElement;
      const monto = parseFloat(input.value);
      if (!this._store.state.formaSeleccionada) { toast('Selecciona una forma de pago'); return; }
      if (!monto || monto <= 0) { toast('Ingresa un monto válido'); return; }
      this._store.agregarPago(monto);
      this._renderCobro();
    });

    document.getElementById('btn-confirmar')?.addEventListener('click', () => this._confirmarCobro());
    document.getElementById('btn-cerrar-cambio')?.addEventListener('click', () => this._finalizarCobro());

    document.getElementById('btn-exit')?.addEventListener('click', () => {
      posSocket.disconnect();
      doLogout();
    });
  }

  private _subscribeChannels(): void {
    // Nuevas órdenes desde mesas (mismo dispositivo, fallback al socket)
    window.addEventListener('storage', e => {
      if (e.key === CAJA_QUEUE_KEY) this._loadQueue();
    });
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (_allowed) new CajaPage().init();
