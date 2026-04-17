import { checkRoleAccess } from '@/global/guards_auth';
import { doLogout } from '@/global/logOut';
const _allowed = checkRoleAccess(['camarero']);

import { toast } from '../shared/utils/toast';
import { fmt } from '../shared/utils/format';
import { cajaChannel, mesasChannel, CAJA_QUEUE_KEY, MESAS_UPDATE_KEY } from '../shared/services/pos-channel';
import { MesasStore } from './mesas.store';
import { FloorPlanScreen } from './screens/floor-plan';
import { TpvScreen } from './screens/tpv';
import { ComensalesModal } from './modals/comensales.modal';
import { ModificadoresModal } from './modals/modificadores.modal';
import { UnirMesaModal } from './modals/unir-mesa.modal';
import type { Mesa, Orden, Articulo } from './mesas.types';

// ─── Demo data ────────────────────────────────────────────────────────────────

import { DEMO } from './mesas.demo';

// ─── Orchestrador ────────────────────────────────────────────────────────────

class MesasPage {
  private readonly _store     = new MesasStore();
  private readonly _floorPlan = new FloorPlanScreen(
    this._store,
    (mesaId) => this._openTPV(mesaId),
    (mesa)   => this._abrirAccionMesa(mesa),
  );
  private readonly _tpv          = new TpvScreen(this._store);
  private readonly _comensalesModal = new ComensalesModal(this._store);
  private readonly _modsModal       = new ModificadoresModal(
    this._store,
    (art) => this._confirmarMods(art),
  );
  private readonly _unirModal = new UnirMesaModal(
    this._store,
    (count) => toast(`${count} mesa(s) unidas ✓`, 'success'),
  );
  private _pollingInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Init ─────────────────────────────────────────────────────────────────

  init(): void {
    this._applyTheme();
    this._loadMesas();
    this._wireEvents();
    this._subscribeChannels();
  }

  private _applyTheme(): void {
    document.documentElement.style.setProperty('--accent',     '#d63050');
    document.documentElement.style.setProperty('--accent-rgb', '214,48,80');
    document.documentElement.style.setProperty('--accent2',    '#f04f5a');
  }

  // ─── Carga inicial ────────────────────────────────────────────────────────

  private _loadMesas(): void {
    // Demo data — reemplazar por llamadas a mesas.service cuando el backend esté listo
    this._store.setZonas(DEMO.zonas);
    this._store.setMesas(DEMO.mesas.map(m => ({ ...m })));
    if (!this._store.state.zonaActiva) {
      this._store.setZonaActiva(DEMO.zonas[0]?.id ?? 0);
    }

    const userEl = document.getElementById('topbar-user');
    if (userEl) {
      try {
        const raw = localStorage.getItem('pos_user');
        userEl.textContent = raw ? (JSON.parse(raw) as { nombre?: string }).nombre ?? '—' : '—';
      } catch { userEl.textContent = '—'; }
    }

    this._floorPlan.renderZonas();
    this._floorPlan.renderMesas();
    this._goTo('mesas');

    if (this._pollingInterval) clearInterval(this._pollingInterval);
    this._pollingInterval = setInterval(() => { /* polling simulado */ }, 15000);
  }

  // ─── Navegación de pantallas ──────────────────────────────────────────────

  private _goTo(screen: 'mesas' | 'tpv'): void {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screen)?.classList.add('active');
  }

  // ─── Acción sobre mesa libre ──────────────────────────────────────────────

  private _abrirAccionMesa(mesa: Mesa): void {
    const titleEl = document.getElementById('accion-mesa-title');
    if (titleEl) titleEl.textContent = 'Mesa ' + mesa.nombre;
    document.getElementById('modal-accion-mesa')!.style.display = 'flex';
  }

  private _cerrarAccionMesa(): void {
    document.getElementById('modal-accion-mesa')!.style.display = 'none';
  }

  // ─── Abrir TPV ────────────────────────────────────────────────────────────

  private _openTPV(mesaId: number): void {
    const mesa = this._store.getMesa(mesaId);
    if (!mesa) return;

    if (mesa.estado === 'por_cobrar') {
      this._intentarCargarDesdeQueue(mesaId);
      return;
    }

    this._store.setZonaActiva(this._store.state.zonaActiva ?? 0); // keep zona
    const ordenId = 2000 + mesaId;
    const orden: Orden = {
      id: ordenId, numero: String(ordenId).padStart(4, '0'),
      mesa_id: mesaId, estado: 'abierta',
      subtotal: 0, impuestos: 0, propina: 0, total: 0, notas: '',
    };
    this._store.openTPV(mesaId, mesa.nombre, 1, orden);

    if (mesa.estado === 'ocupada') {
      // Precargar líneas demo para mesas ya abiertas
      this._store.setLineas(DEMO.getLineasDemo(ordenId));
    }

    this._loadTPVScreen();
  }

  private _intentarCargarDesdeQueue(mesaId: number): void {
    try {
      const queue = JSON.parse(localStorage.getItem(CAJA_QUEUE_KEY) ?? '[]') as Array<{
        mesaId: number; id: number; orden: Orden; lineas: typeof this._store.state.lineas;
        numComensales: number; splitMode: boolean; numCuentas: number;
      }>;
      const ticket = queue.find(t => t.mesaId === mesaId);
      if (ticket) {
        const mesa = this._store.getMesa(mesaId)!;
        this._store.openTPV(mesaId, mesa.nombre, ticket.numComensales, ticket.orden);
        this._store.setLineas(ticket.lineas);
        this._loadTPVScreen();
      } else {
        toast('Esta mesa ya está en proceso de cobro en caja');
      }
    } catch {
      toast('Esta mesa ya está en proceso de cobro en caja');
    }
  }

  private _loadTPVScreen(): void {
    const { mesaLabel } = this._store.state;
    const labelEl = document.getElementById('tpv-mesa-label');
    if (labelEl) labelEl.textContent = 'Mesa ' + mesaLabel;

    this._store.setFamilias(DEMO.familias);
    this._store.setFamiliaActiva(DEMO.familias[0]?.id ?? 0);
    this._loadArticulos();
    this._tpv.renderOrden();
    this._tpv.setupNotaDebounce();
    this._goTo('tpv');
  }

  private _loadArticulos(): void {
    const { familiaActiva } = this._store.state;
    const arts = familiaActiva ? (DEMO.articulos[familiaActiva] ?? []) : [];
    this._store.setArticulos(arts);
    this._tpv.renderFamilias();
    this._tpv.renderArticulos();
  }

  // ─── Wiring de eventos ────────────────────────────────────────────────────

  private _wireEvents(): void {
    // ── Zonas tabs ──
    document.getElementById('zonas-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-zona]');
      if (!btn) return;
      this._store.setZonaActiva(Number(btn.dataset.zona));
      this._floorPlan.renderZonas();
      this._floorPlan.renderMesas();
    });

    // ── Floor plan clicks ──
    document.getElementById('mesas-grid')?.addEventListener('click', e => {
      const fp = (e.target as HTMLElement).closest<HTMLElement>('[data-mesa-id]');
      if (!fp) return;
      this._floorPlan.handleMesaClick(Number(fp.dataset.mesaId));
    });

    // ── Merge bar ──
    document.getElementById('merge-bar-confirm')?.addEventListener('click', () => {
      this._store.confirmarMerge();
      this._floorPlan.renderMergeBar();
      this._floorPlan.renderMesas();
      const principal = this._store.state.mergeSelected; // ya vacío tras confirmar
      if (principal) {
        const mesaId = this._store.state.mergePrincipal?.id ?? this._store.state.mesaId!;
        this._openTPV(mesaId);
      }
    });
    document.querySelector('[data-cancelar-merge]')?.addEventListener('click', () => {
      this._store.cancelMerge();
      this._floorPlan.renderMergeBar();
      this._floorPlan.renderMesas();
    });

    // ── Modal acción mesa ──
    document.querySelector('[data-abrir-orden]')?.addEventListener('click', () => {
      this._cerrarAccionMesa();
      const mesa = this._store.getMesa(this._store.state.mesaId!);
      if (!mesa) return;
      this._comensalesModal.open('Mesa ' + mesa.nombre, () => {
        const ordenId = this._store.nextId();
        const orden: Orden = {
          id: ordenId, numero: String(ordenId).padStart(4, '0'),
          mesa_id: mesa.id, estado: 'abierta',
          subtotal: 0, impuestos: 0, propina: 0, total: 0, notas: '',
        };
        this._store.patchMesa(mesa.id, { estado: 'ocupada' });
        this._store.openTPV(mesa.id, mesa.nombre, this._store.state.numComensales, orden);
        this._loadTPVScreen();
      });
    });
    document.querySelector('[data-iniciar-union]')?.addEventListener('click', () => {
      this._cerrarAccionMesa();
      const mesa = this._store.getMesa(this._store.state.mesaId!);
      if (!mesa) return;
      this._store.initMerge(mesa);
      this._floorPlan.renderMergeBar();
      this._floorPlan.renderMesas();
    });
    document.querySelector('[data-cerrar-accion-mesa]')?.addEventListener('click', () => {
      this._cerrarAccionMesa();
    });

    // ── Modal comensales ──
    document.getElementById('comensales-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-n]');
      if (btn) this._comensalesModal.selectN(Number(btn.dataset.n));
    });
    document.querySelector('[data-cerrar-comensales]')?.addEventListener('click', () => {
      this._comensalesModal.close();
    });
    document.querySelector('[data-confirmar-comensales]')?.addEventListener('click', () => {
      this._comensalesModal.confirm();
    });

    // ── Mesas: cerrar sesión ──
    document.getElementById('btn-exit-mesas')?.addEventListener('click', () => doLogout());

    // ── TPV: volver a mesas ──
    document.querySelector('[data-back-mesas]')?.addEventListener('click', () => {
      this._store.resetTPV();
      this._floorPlan.renderMesas();
      this._goTo('mesas');
    });

    // ── TPV: familias ──
    document.getElementById('familias-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-familia]');
      if (!btn) return;
      this._store.setFamiliaActiva(Number(btn.dataset.familia));
      this._loadArticulos();
    });

    // ── TPV: artículos ──
    document.getElementById('articulos-grid')?.addEventListener('click', e => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-articulo]');
      if (!card) return;
      const artId = Number(card.dataset.articulo);
      const art   = this._store.state.articulos.find(a => a.id === artId);
      if (!art) return;
      const mods = DEMO.modificadores[artId];
      if (art.tiene_mods && mods?.length) {
        this._modsModal.open(art, mods);
      } else {
        this._store.agregarLinea(art, []);
        toast(art.nombre + ' agregado', 'success');
        this._tpv.renderOrden();
      }
    });

    // ── TPV: orden (líneas) ──
    document.getElementById('orden-lineas')?.addEventListener('click', e => {
      const target = e.target as HTMLElement;

      // Cambiar comensales
      if (target.closest('[data-cambiar-comensales]')) {
        const { mesaLabel } = this._store.state;
        this._comensalesModal.open('Mesa ' + mesaLabel, () => this._tpv.renderOrden());
        return;
      }

      // Ciclar cuenta
      const ciclar = target.closest<HTMLElement>('[data-ciclar]');
      if (ciclar) { e.stopPropagation(); this._store.ciclarCuenta(Number(ciclar.dataset.ciclar)); this._tpv.renderOrden(); return; }

      // Qty
      const qty = target.closest<HTMLElement>('[data-qty]');
      if (qty) { e.stopPropagation(); this._store.cambiarCantidad(Number(qty.dataset.qty), Number(qty.dataset.delta)); this._tpv.renderOrden(); return; }

      // Delete
      const del = target.closest<HTMLElement>('[data-delete]');
      if (del) { e.stopPropagation(); this._store.eliminarLinea(Number(del.dataset.delete)); toast('Artículo eliminado'); this._tpv.renderOrden(); return; }

      // Select línea
      const sel = target.closest<HTMLElement>('[data-linea-select]');
      if (sel) { this._store.selectLinea(Number(sel.dataset.lineaSelect)); this._tpv.renderOrden(); }
    });

    // ── TPV: acciones ──
    document.querySelector('[data-enviar-cocina]')?.addEventListener('click', () => this._enviarCocina());
    document.querySelector('[data-pedir-cuenta]')?.addEventListener('click', () => this._pedirCuenta());
    document.getElementById('btn-split')?.addEventListener('click', () => { this._store.toggleSplit(); this._tpv.renderOrden(); });

    // ── Modal modificadores ──
    document.getElementById('modal-grupos')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-opcion]');
      if (!btn) return;
      const grupoId  = Number(btn.dataset.grupo);
      const opcionId = Number(btn.dataset.opcion);
      const sel      = btn.dataset.sel as 'unica' | 'multiple';
      this._modsModal.toggleOption(grupoId, opcionId, sel);
    });
    document.querySelector('[data-cerrar-mods]')?.addEventListener('click', () => this._modsModal.close());
    document.getElementById('btn-agregar-modal')?.addEventListener('click', () => this._modsModal.confirm());

    // ── Modal unir TPV ──
    document.querySelector('[data-abrir-unir-tpv]')?.addEventListener('click', () => this._unirModal.open());
    document.querySelector('[data-cerrar-unir-tpv]')?.addEventListener('click', () => this._unirModal.close());
    document.getElementById('btn-confirmar-unir-tpv')?.addEventListener('click', () => this._unirModal.confirm());
    document.getElementById('unir-mesas-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-unir]');
      if (btn) this._unirModal.toggleMesa(Number(btn.dataset.unir));
    });
  }

  // ─── Acciones TPV ────────────────────────────────────────────────────────

  private _enviarCocina(): void {
    const pendientes = this._store.state.lineas.filter(l => l.estado === 'pendiente');
    if (!pendientes.length) { toast('No hay artículos pendientes'); return; }
    this._store.marcarEnviadas();
    toast('Enviado a cocina ✓', 'success');
    this._tpv.renderOrden();
  }

  private _pedirCuenta(): void {
    const { lineas, ordenId, mesaId, mesaLabel, numComensales, orden, splitMode, numCuentas } = this._store.state;
    if (!lineas.length) { toast('La orden está vacía'); return; }

    const ticket = {
      id: ordenId, mesaId, mesaLabel, numComensales,
      orden: { ...orden },
      lineas: lineas.map(l => ({ ...l })),
      splitMode, numCuentas,
      timestamp: Date.now(),
    };

    try {
      const queue = JSON.parse(localStorage.getItem(CAJA_QUEUE_KEY) ?? '[]') as typeof ticket[];
      const idx = queue.findIndex(t => t.mesaId === ticket.mesaId);
      if (idx >= 0) queue[idx] = ticket; else queue.push(ticket);
      localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
      cajaChannel.send({ tipo: 'nueva_orden', ticket });
    } catch { /* ignorar */ }

    if (mesaId !== null) this._store.patchMesa(mesaId, { estado: 'por_cobrar' });
    toast('Cuenta enviada a caja ✓', 'success');

    setTimeout(() => {
      this._store.resetTPV();
      this._floorPlan.renderMesas();
      this._goTo('mesas');
    }, 800);
  }

  private _confirmarMods(art: Articulo): void {
    const mods = this._store.getSelectedMods();
    this._store.agregarLinea(art, mods);
    toast(art.nombre + ' agregado', 'success');
    this._tpv.renderOrden();
  }

  // ─── Canales inter-módulos ────────────────────────────────────────────────

  private _subscribeChannels(): void {
    // Escuchar mesa liberada desde caja
    mesasChannel.on(msg => {
      if (msg.tipo === 'mesa_liberada') {
        this._store.patchMesa(msg.mesaId, { estado: 'libre', personas: 0 });
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
      }
    });

    // Fallback: storage event
    window.addEventListener('storage', e => {
      if (e.key !== MESAS_UPDATE_KEY) return;
      try {
        const updates = JSON.parse(e.newValue ?? '[]') as Array<{ mesaId: number; estado: string }>;
        updates.forEach(u => {
          this._store.patchMesa(u.mesaId, {
            estado: u.estado as Mesa['estado'],
            ...(u.estado === 'libre' ? { personas: 0 } : {}),
          });
        });
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
      } catch { /* ignorar */ }
    });
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (_allowed) new MesasPage().init();

// ─── Helpers de formato expuestos al HTML ─────────────────────────────────────
// (sólo por compatibilidad con el <template> HTML — retirar tras migración completa)
(window as unknown as Record<string, unknown>)['fmt'] = fmt;
