import { checkRoleAccess } from '@/global/guards_auth';
import { doLogout } from '@/global/logOut';
const _allowed = checkRoleAccess(['camarero']);

import { getUser, getSucursalId, getSelectedRole } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { toast } from '../shared/utils/toast';
import { cajaChannel, mesasChannel, CAJA_QUEUE_KEY, MESAS_UPDATE_KEY } from '../shared/services/pos-channel';
import { posSocket } from '../shared/services/pos-socket';
import { MesasStore } from './mesas.store';
import { FloorPlanScreen } from './screens/floor-plan';
import { TpvScreen } from './screens/tpv';
import { ComensalesModal } from './modals/comensales.modal';
import { ModificadoresModal } from './modals/modificadores.modal';
import { UnirMesaModal } from './modals/unir-mesa.modal';
import type { Mesa, Orden } from './mesas.types';
import {
  getZonas, getMesasByZona, getFamilias, getArticulos, getModificadores,
  getImpuestosSucursal,
  createOrden, getOrdenActivaMesa, getLineas,
  createLinea, updateLinea, deleteLinea,
  marcarOrdenEnPreparacion, marcarOrdenPorCobrar,
  patchEstadoMesa, patchMesaPersonas, patchMesaData,
} from './mesas.service';
import { fmt } from '../shared/utils/format';

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
    (mesasIds) => {
      if (!mesasIds.length) return;
      const principalId = this._store.state.mesaId!;
      // Persistir cada mesa secundaria en la BD
      mesasIds.forEach(id =>
        patchMesaData(id, { estado: 'ocupada', mesa_principal_id: principalId }).catch(() => {}),
      );
      // Broadcast tiempo real → otros ven las mesas como ocupadas+unidas en el floor plan
      posSocket.emitMesasUnidas(principalId, mesasIds);
      toast(`${mesasIds.length} mesa(s) unidas ✓`, 'success');
    },
  );

  private _sucursalId   = 0;
  private _usuarioId    = 0;
  private _mesaAccion: Mesa | null = null;
  private _miRol        = '';

  // ─── Init ─────────────────────────────────────────────────────────────────

  init(): void {
    this._applyTheme();

    this._sucursalId = getSucursalId();
    if (!this._sucursalId) {
      location.replace(route('/lobby'));
      return;
    }

    const user = getUser();
    this._usuarioId = user?.id ?? 0;
    this._miRol     = getSelectedRole()?.nombre?.toLowerCase() ?? '';

    this._connectSocket();
    this._loadMesas();
    this._wireEvents();
    this._subscribeChannels();
  }

  private _applyTheme(): void {
    document.documentElement.style.setProperty('--accent',     '#d63050');
    document.documentElement.style.setProperty('--accent-rgb', '214,48,80');
    document.documentElement.style.setProperty('--accent2',    '#f04f5a');
  }

  // ─── Socket ───────────────────────────────────────────────────────────────

  private _connectSocket(): void {
    import('@/global/session.service').then(({ getToken }) => {
      const tk = getToken();
      if (!tk) return;

      posSocket.connect(tk, this._sucursalId, 'mesas');

      // mesa:estado_cambio — actualiza el floor plan en tiempo real
      posSocket.onMesaEstadoCambio(({ mesa_id, estado, personas, mesa_principal_id }) => {
        this._store.patchMesa(mesa_id, {
          estado,
          ...(personas !== undefined ? { personas } : {}),
          ...(mesa_principal_id !== undefined ? { mesa_principal_id } : {}),
        });
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
        // Si estamos en el TPV de esa mesa y cambió el nº de comensales, actualizar cabecera
        if (
          personas !== undefined &&
          mesa_id === this._store.state.mesaId &&
          document.getElementById('screen-tpv')?.classList.contains('active')
        ) {
          this._store.setNumComensales(personas);
          this._tpv.renderOrden();
        }
      });

      // caja:pago_registrado — libera la mesa automáticamente
      posSocket.onCajaPagoRegistrado(({ mesa_id }) => {
        this._store.patchMesa(mesa_id, { estado: 'libre', personas: 0 });
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
        toast('Mesa liberada — pago registrado', 'success');
      });

      // caja:orden_anulada
      posSocket.onCajaOrdenAnulada(({ mesa_id }) => {
        this._store.patchMesa(mesa_id, { estado: 'libre', personas: 0 });
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
        toast('Orden anulada');
      });

      posSocket.onError(({ mensaje }) => toast('Error: ' + mensaje));

      // presencia inicial al conectar
      posSocket.onMesaPresencia(({ presencias }) => {
        this._store.setPresencias(presencias);
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
      });

      // alguien entró a una mesa
      posSocket.onServidorUsuarioEntro(({ mesa_id, usuario_id, nombre, rol }) => {
        this._store.addPresencia(mesa_id, { usuario_id, nombre, rol });
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
      });

      // alguien salió de una mesa
      posSocket.onServidorUsuarioSalio(({ mesa_id, usuario_id }) => {
        this._store.removePresencia(mesa_id, usuario_id);
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
      });

      // KDS terminó toda la orden → habilitar "pedir cuenta"
      posSocket.onKdsOrdenCompleta(({ orden_id }) => {
        if (orden_id !== this._store.state.ordenId) return;
        this._store.setOrdenCompleta(true);
        if (document.getElementById('screen-tpv')?.classList.contains('active')) {
          this._tpv.renderOrden();
          toast('Cocina lista — puedes pedir la cuenta', 'success');
        }
      });

      // Confirmación del socket: si ningún ítem fue a KDS, habilitamos la cuenta ya
      posSocket.onOrdenLineasConfirmadas(({ orden_id, destinos }) => {
        if (orden_id !== this._store.state.ordenId) return;
        const sinKds = destinos.cocina.length === 0 && destinos.barra.length === 0;
        if (sinKds) {
          this._store.setOrdenCompleta(true);
          if (document.getElementById('screen-tpv')?.classList.contains('active')) {
            this._tpv.renderOrden();
          }
        }
      });

      // Sync en tiempo real: otro camarero de la misma mesa agregó/modificó/borró línea
      posSocket.onOrdenLineaSincronizada(({ orden_id, accion, linea }) => {
        const { ordenId } = this._store.state;
        if (orden_id !== ordenId) return;
        if (accion === 'add')    this._store.sincronizarLineaExterna(linea);
        if (accion === 'update') this._store.sincronizarLineaExterna(linea);
        if (accion === 'delete') this._store.eliminarLinea(linea.id);
        if (document.getElementById('screen-tpv')?.classList.contains('active')) {
          this._tpv.renderOrden();
        }
      });
    });
  }

  // ─── Carga inicial ────────────────────────────────────────────────────────

  private _loadMesas(): void {
    this._store.setCargando(true);

    const userEl = document.getElementById('topbar-user');
    const user = getUser();
    if (userEl) userEl.textContent = user?.nombre ?? '—';

    console.log('[Mesas] Cargando zonas para sucursal:', this._sucursalId);

    getZonas(this._sucursalId)
      .then(zonas => {
        console.log('[Mesas] Zonas obtenidas:', zonas);
        this._store.setZonas(zonas);
        this._floorPlan.renderZonas();

        if (!zonas.length) {
          console.warn('[Mesas] No hay zonas para esta sucursal');
          this._store.setCargando(false);
          this._goTo('mesas');
          return;
        }

        const primeraZona = zonas[0];
        this._store.setZonaActiva(primeraZona.id);
        this._floorPlan.renderZonas();

        console.log('[Mesas] Cargando mesas de zona:', primeraZona.id, primeraZona.nombre);
        return getMesasByZona(primeraZona.id).then(mesas => {
          console.log('[Mesas] Mesas obtenidas:', mesas);
          this._store.setMesas(mesas);
          this._floorPlan.renderMesas();
          this._goTo('mesas');
        });
      })
      .catch(err => {
        console.error('[Mesas] Error al cargar:', err);
        toast('Error al cargar mesas');
      })
      .finally(() => this._store.setCargando(false));
  }

  // ─── Navegación de pantallas ──────────────────────────────────────────────

  private _goTo(screen: 'mesas' | 'tpv'): void {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screen)?.classList.add('active');
  }

  // ─── Acción sobre mesa libre ──────────────────────────────────────────────

  private _abrirAccionMesa(mesa: Mesa): void {
    if (this._isMesaBlockedForMe(mesa.id)) {
      toast('Otro camarero ya está atendiendo esta mesa', 'error');
      return;
    }
    this._mesaAccion = mesa;
    const titleEl = document.getElementById('accion-mesa-title');
    if (titleEl) titleEl.textContent = 'Mesa ' + mesa.nombre;
    document.getElementById('modal-accion-mesa')!.style.display = 'flex';
  }

  private _cerrarAccionMesa(): void {
    document.getElementById('modal-accion-mesa')!.style.display = 'none';
  }

  // ─── Restricción: solo 1 camarero por mesa ────────────────────────────────

  private _isMesaBlockedForMe(mesaId: number): boolean {
    if (this._miRol !== 'camarero') return false;
    return this._store.getPresencias(mesaId)
      .some(u => u.rol.toLowerCase() === 'camarero' && u.usuario_id !== this._usuarioId);
  }

  // ─── Popover de presencia ─────────────────────────────────────────────────

  private _togglePresenciaPopover(badge: HTMLElement): void {
    const existing = document.getElementById('presencia-popover');
    if (existing) { existing.remove(); return; }

    const mesaId = Number(badge.closest<HTMLElement>('[data-mesa-id]')?.dataset.mesaId);
    const presencias = this._store.getPresencias(mesaId);
    if (!presencias.length) return;

    const popover = document.createElement('div');
    popover.id = 'presencia-popover';
    popover.className = 'presencia-popover';
    popover.innerHTML = `
      <div class="presencia-popover-title">En esta mesa</div>
      ${presencias.map(u => {
        const iniciales = u.nombre.split(' ').map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2);
        return `
          <div class="presencia-popover-row">
            <span class="presencia-popover-avatar">${iniciales}</span>
            <span class="presencia-popover-nombre">${u.nombre}</span>
            <span class="presencia-popover-rol">${u.rol}</span>
          </div>`;
      }).join('')}
    `;

    const rect = badge.getBoundingClientRect();
    popover.style.top  = `${rect.bottom + 6}px`;
    popover.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;
    document.body.appendChild(popover);
  }

  // ─── Abrir TPV ────────────────────────────────────────────────────────────

  private _openTPV(mesaId: number): void {
    const mesa = this._store.getMesa(mesaId);
    if (!mesa) return;

    if (mesa.estado === 'por_cobrar') {
      this._intentarCargarDesdeQueue(mesaId);
      return;
    }

    if (this._isMesaBlockedForMe(mesaId)) {
      toast('Otro camarero ya está atendiendo esta mesa', 'error');
      return;
    }

    this._store.setCargando(true);

    if (mesa.estado === 'ocupada') {
      // Mesa ocupada — cargar la orden activa desde la BD
      getOrdenActivaMesa(mesaId)
        .then(ordenes => {
          const orden = ordenes[0];
          if (!orden) {
            toast('No se encontró orden activa para esta mesa');
            this._store.setCargando(false);
            return;
          }
          return getLineas(orden.id).then(lineas => {
            const personas = mesa.personas ?? lineas.length;
            this._store.openTPV(mesaId, mesa.nombre, personas, orden);
            this._store.setLineas(lineas);
            posSocket.emitUsuarioEntro(mesaId);
            this._loadTPVScreen();
          });
        })
        .catch(() => toast('Error al cargar la orden'))
        .finally(() => this._store.setCargando(false));
    } else {
      // Mesa libre seleccionada desde el modal — la orden ya fue creada en _abrirOrden
      // Este path solo se llega si se abrió directo (no debería pasar con mesa libre)
      this._store.setCargando(false);
    }
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
        posSocket.emitUsuarioEntro(mesaId);
        this._loadTPVScreen();
      } else {
        toast('Esta mesa ya está en proceso de cobro en caja');
      }
    } catch {
      toast('Esta mesa ya está en proceso de cobro en caja');
    }
  }

  private _abrirComensalesParaMesa(mesa: Mesa): void {
  this._mesaAccion = mesa;
  this._comensalesModal.open(
    'Mesa ' + mesa.nombre,
    () => this._abrirOrden(mesa),
    mesa,
    (otraMesa) => this._abrirComensalesParaMesa(otraMesa),
   (mesaOrigen) => {                    // ← onUnirMesas
     this._store.initMerge(mesaOrigen);
     this._floorPlan.renderMergeBar();
     this._floorPlan.renderMesas();
     this._goTo('mesas');
   },
  );
}

  /** Crea nueva orden en la BD y abre el TPV. Llamado desde el modal de comensales. */
  private _abrirOrden(mesa: Mesa): void {
    this._store.setCargando(true);
    createOrden({
      sucursal_id: this._sucursalId,
      mesa_id: mesa.id,
      usuario_id: this._usuarioId,
      tipo_servicio: 'mesa',
    })
      .then(orden => {
        const numComensales = this._store.state.numComensales;
        this._store.patchMesa(mesa.id, { estado: 'ocupada', personas: numComensales });
        this._store.openTPV(mesa.id, mesa.nombre, numComensales, orden);
        patchEstadoMesa(mesa.id, 'ocupada').catch(() => {});
        patchMesaPersonas(mesa.id, numComensales).catch(() => {});
        posSocket.emitUsuarioEntro(mesa.id, numComensales);
        this._loadTPVScreen();
      })
      .catch(() => toast('Error al crear la orden'))
      .finally(() => this._store.setCargando(false));
  }

  private _loadTPVScreen(): void {
    const { mesaLabel } = this._store.state;
    const labelEl = document.getElementById('tpv-mesa-label');
    if (labelEl) labelEl.textContent = 'Mesa ' + mesaLabel;

    this._store.setCargando(true);
    getImpuestosSucursal(this._sucursalId)
      .then(impuestos => {
        console.log('[TPV] Impuestos sucursal:', impuestos);
        this._store.setImpuestos(impuestos);
      })
      .catch(err => console.warn('[TPV] No se cargaron impuestos:', err));

    console.log('[TPV] Cargando familias para sucursal:', this._sucursalId);
    getFamilias(this._sucursalId)
      .then(familias => {
        console.log('[TPV] Familias obtenidas:', familias);
        this._store.setFamilias(familias);
        if (familias.length) this._store.setFamiliaActiva(familias[0].id);
        return this._loadArticulos();
      })
      .then(() => {
        this._tpv.renderOrden();
        this._tpv.setupNotaDebounce();
        this._goTo('tpv');
      })
      .catch(err => {
        console.error('[TPV] Error al cargar el catálogo:', err);
        toast('Error al cargar el catálogo');
      })
      .finally(() => this._store.setCargando(false));
  }

  private _loadArticulos(): Promise<void> {
    const { familiaActiva } = this._store.state;
    if (!familiaActiva) {
      this._store.setArticulos([]);
      this._tpv.renderFamilias();
      this._tpv.renderArticulos();
      return Promise.resolve();
    }
    console.log('[TPV] Cargando artículos para familia:', familiaActiva);
    return getArticulos(familiaActiva)
      .then(arts => {
        console.log('[TPV] Artículos obtenidos:', arts);
        this._store.setArticulos(arts);
        this._tpv.renderFamilias();
        this._tpv.renderArticulos();
      });
  }

  // ─── Wiring de eventos ────────────────────────────────────────────────────

  private _wireEvents(): void {
    // ── Zonas tabs ──
    document.getElementById('zonas-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-zona]');
      if (!btn) return;
      const zonaId = Number(btn.dataset.zona);
      this._store.setZonaActiva(zonaId);
      this._floorPlan.renderZonas();
      this._store.setCargando(true);
      getMesasByZona(zonaId)
        .then(mesas => {
          this._store.setMesas(mesas);
          this._floorPlan.renderMesas();
        })
        .catch(() => toast('Error al cargar mesas de la zona'))
        .finally(() => this._store.setCargando(false));
    });

    // ── Floor plan clicks ──
    document.getElementById('mesas-grid')?.addEventListener('click', e => {
      const badge = (e.target as HTMLElement).closest<HTMLElement>('[data-presencia-badge]');
      if (badge) { this._togglePresenciaPopover(badge); return; }

      const fp = (e.target as HTMLElement).closest<HTMLElement>('[data-mesa-id]');
      if (!fp) return;
      this._floorPlan.handleMesaClick(Number(fp.dataset.mesaId));
    });

    // ── Cerrar popover al hacer clic fuera ──
    document.addEventListener('click', e => {
      const popover = document.getElementById('presencia-popover');
      if (!popover) return;
      if (!popover.contains(e.target as Node) &&
          !(e.target as HTMLElement).closest('[data-presencia-badge]')) {
        popover.remove();
      }
    });

    // ── Merge bar ──
    document.getElementById('merge-bar-confirm')?.addEventListener('click', () => {
      this._store.confirmarMerge();
      this._floorPlan.renderMergeBar();
      this._floorPlan.renderMesas();
      const mesaId = this._store.state.mergePrincipal?.id ?? this._store.state.mesaId;
      if (mesaId) this._openTPV(mesaId);
    });
    document.querySelector('[data-cancelar-merge]')?.addEventListener('click', () => {
      this._store.cancelMerge();
      this._floorPlan.renderMergeBar();
      this._floorPlan.renderMesas();
    });

    // ── Modal acción mesa ──
    document.querySelector('[data-abrir-orden]')?.addEventListener('click', () => {
      this._cerrarAccionMesa();
      const mesa = this._mesaAccion;
      if (!mesa) return;
      this._abrirComensalesParaMesa(mesa);
    });
    document.querySelector('[data-iniciar-union]')?.addEventListener('click', () => {
      this._cerrarAccionMesa();
      const mesa = this._mesaAccion;
      if (!mesa) return;
      this._store.initMerge(mesa);
      this._floorPlan.renderMergeBar();
      this._floorPlan.renderMesas();
    });
    document.querySelector('[data-cerrar-accion-mesa]')?.addEventListener('click', () => {
      this._cerrarAccionMesa();
    });

     document.getElementById('comensales-warning')?.addEventListener('click', e => {
   if ((e.target as HTMLElement).closest('[data-unir-desde-comensales]')) {
     this._comensalesModal.handleUnirMesasClick();
   }
 });
    // ── Modal comensales ──
    document.getElementById('comensales-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-n]');
      if (!btn) return;
      if (btn.dataset.n === 'custom') {
        this._comensalesModal.showCustomInput();
      } else {
        this._comensalesModal.selectN(Number(btn.dataset.n));
      }
    });
    document.getElementById('comensales-custom-input')?.addEventListener('input', () => {
      this._comensalesModal.applyCustomInput();
    });
    document.getElementById('comensales-sugerencias')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-sugerencia]');
      if (btn) this._comensalesModal.handleSugerenciaClick(Number(btn.dataset.sugerencia));
    });
    document.querySelector('[data-cerrar-comensales]')?.addEventListener('click', () => {
      this._comensalesModal.close();
    });
    document.querySelector('[data-confirmar-comensales]')?.addEventListener('click', () => {
  this._comensalesModal.confirm(); // ← ejecuta sin importar si hay overflow
});

    // ── Mesas: cerrar sesión ──
    document.getElementById('btn-exit-mesas')?.addEventListener('click', () => {
      posSocket.disconnect();
      doLogout();
    });

    // ── TPV: volver a mesas ──
    document.querySelector('[data-back-mesas]')?.addEventListener('click', () => {
      const mesaId = this._store.state.mesaId;
      if (mesaId) posSocket.emitUsuarioSalio(mesaId);
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

      this._store.setCargando(true);
      getModificadores(artId)
        .then(grupos => {
          if (grupos.length) {
            this._modsModal.open(art, grupos);
          } else {
            this._agregarArticulo(art, []);
          }
        })
        .catch((err) => { console.error('[Mods] Error:', err); toast('Error al cargar modificadores'); })
        .finally(() => this._store.setCargando(false));
    });

    // ── TPV: cambiar comensales (desde orden-info, encima de la lista) ──
    document.getElementById('orden-info')?.addEventListener('click', e => {
      if (!(e.target as HTMLElement).closest('[data-cambiar-comensales]')) return;
      const { mesaLabel, mesaId } = this._store.state;
      const mesa = mesaId ? this._store.getMesa(mesaId) : undefined;
      this._comensalesModal.open(
        'Mesa ' + mesaLabel,
        () => {
          const { numComensales, mesaId: mid } = this._store.state;
          if (mid) {
            patchMesaPersonas(mid, numComensales).catch(() => {});
            this._store.patchMesa(mid, { personas: numComensales });
            posSocket.emitUsuarioEntro(mid, numComensales);
          }
          this._tpv.renderOrden();
        },
        mesa,
      );
    });

    // ── TPV: orden (líneas) ──
    document.getElementById('orden-lineas')?.addEventListener('click', e => {
      const target = e.target as HTMLElement;

      const ciclar = target.closest<HTMLElement>('[data-ciclar]');
      if (ciclar) {
        e.stopPropagation();
        this._store.ciclarCuenta(Number(ciclar.dataset.ciclar));
        this._tpv.renderOrden();
        return;
      }

      const qty = target.closest<HTMLElement>('[data-qty]');
      if (qty) {
        e.stopPropagation();
        const lineaId = Number(qty.dataset.qty);
        const delta   = Number(qty.dataset.delta);
        const linea   = this._store.state.lineas.find(l => l.id === lineaId);
        if (linea && linea.id > 0) {
          // Línea ya persistida — sincronizar con BD y broadcast
          const nuevaCantidad = Math.max(1, linea.cantidad + delta);
          updateLinea(linea.orden_id, lineaId, {
            cantidad: nuevaCantidad,
            subtotal_linea: nuevaCantidad * linea.precio_unitario,
          }).then(() => {
            const { ordenId, mesaId } = this._store.state;
            const lineaActualizada = this._store.state.lineas.find(l => l.id === lineaId);
            if (ordenId && mesaId && lineaActualizada) {
              posSocket.emitLineaSincronizada({ orden_id: ordenId, mesa_id: mesaId, accion: 'update', linea: lineaActualizada });
            }
          }).catch(() => toast('Error al actualizar cantidad'));
        }
        this._store.cambiarCantidad(lineaId, delta);
        this._tpv.renderOrden();
        return;
      }

      const del = target.closest<HTMLElement>('[data-delete]');
      if (del) {
        e.stopPropagation();
        const lineaId = Number(del.dataset.delete);
        const linea   = this._store.state.lineas.find(l => l.id === lineaId);
        if (linea && linea.id > 0) {
          deleteLinea(linea.orden_id, lineaId)
            .then(() => {
              const { ordenId, mesaId } = this._store.state;
              if (ordenId && mesaId) {
                posSocket.emitLineaSincronizada({ orden_id: ordenId, mesa_id: mesaId, accion: 'delete', linea });
              }
            })
            .catch(() => toast('Error al eliminar'));
        }
        this._store.eliminarLinea(lineaId);
        toast('Artículo eliminado');
        this._tpv.renderOrden();
        return;
      }

      const sel = target.closest<HTMLElement>('[data-linea-select]');
      if (sel) {
        this._store.selectLinea(Number(sel.dataset.lineaSelect));
        this._tpv.renderOrden();
      }
    });

    // ── TPV: acciones ──
    document.querySelector('[data-enviar-cocina]')?.addEventListener('click', () => this._enviarCocina());
    document.querySelector('[data-pedir-cuenta]')?.addEventListener('click', () => this._pedirCuenta());
    document.getElementById('btn-split')?.addEventListener('click', () => {
      this._store.toggleSplit();
      this._tpv.renderOrden();
    });

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
    const { lineas, ordenId } = this._store.state;

    // Líneas aún con ID temporal (la BD call está en vuelo)
    if (lineas.some(l => l.id < 0)) {
      toast('Guardando artículos, espera un momento...');
      return;
    }

    const nuevas = lineas.filter(l => !l.enviado_a_cocina);
    if (!nuevas.length) { toast('No hay artículos nuevos pendientes'); return; }
    if (!ordenId) return;

    this._store.setCargando(true);

    // 1. Persistir las líneas que aún no tienen ID real en la BD
    const sinPersistir = nuevas.filter(l => l.id < 0);
    const yaEnBD       = nuevas.filter(l => l.id > 0);

    const promesas = sinPersistir.map(l =>
      createLinea(ordenId, {
        articulo_id:     l.articulo_id,
        cantidad:        l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal_linea:  l.subtotal_linea,
        cuenta_num:      l.cuenta_num,
        notas_linea:     l.notas_linea,
        modificadores:   l.modificadores.map(m => ({
          modificador_id: m.modificador_id,
          precio_extra:   m.precio_extra,
        })),
      }).then(lineaReal => {
        this._store.confirmarLineaPersistida(l.id, lineaReal);
        return lineaReal;
      })
    );

    Promise.all(promesas)
      .then(nuevasPersistidas => {
        // 2. HTTP — cambia el estado de la orden a en_preparacion
        return marcarOrdenEnPreparacion(ordenId).then(() => nuevasPersistidas);
      })
      .then(nuevasPersistidas => {
        // 3. Socket — el backend routea a cocina o barra según destino_impresion
        const linea_ids = [
          ...nuevasPersistidas.map(l => l.id),
          ...yaEnBD.map(l => l.id),
        ].filter(id => id > 0);
        posSocket.emitEnviarCocina(ordenId, linea_ids);
        this._store.marcarEnviadas();
        this._store.setOrdenCompleta(false); // esperar confirmación de KDS
        toast('Enviado a cocina ✓', 'success');
        this._tpv.renderOrden();
      })
      .catch(() => toast('Error al enviar a cocina'))
      .finally(() => this._store.setCargando(false));
  }

  private _pedirCuenta(): void {
    const { lineas, ordenId, mesaId, mesaLabel, numComensales, orden, splitMode, numCuentas } = this._store.state;
    if (!lineas.length) { toast('La orden está vacía'); return; }
    if (!ordenId || !mesaId) return;

    this._store.setCargando(true);
    marcarOrdenPorCobrar(ordenId)
      .then(() => {
        const ticket = {
          id: ordenId, mesaId, mesaLabel, numComensales,
          orden: { ...orden },
          lineas: lineas.map(l => ({ ...l })),
          splitMode, numCuentas,
          timestamp: Date.now(),
        };

        // Cola localStorage como fallback para mismo dispositivo
        try {
          const queue = JSON.parse(localStorage.getItem(CAJA_QUEUE_KEY) ?? '[]') as typeof ticket[];
          const idx = queue.findIndex(t => t.mesaId === ticket.mesaId);
          if (idx >= 0) queue[idx] = ticket; else queue.push(ticket);
          localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
          cajaChannel.send({ tipo: 'nueva_orden', ticket });
        } catch { /* ignorar */ }

        this._store.patchMesa(mesaId, { estado: 'por_cobrar' });
        posSocket.emitUsuarioSalio(mesaId);
        toast('Cuenta enviada a caja ✓', 'success');

        setTimeout(() => {
          this._store.resetTPV();
          this._floorPlan.renderMesas();
          this._goTo('mesas');
        }, 800);
      })
      .catch(() => toast('Error al solicitar la cuenta'))
      .finally(() => this._store.setCargando(false));
  }

  private _confirmarMods(art: import('./mesas.types').Articulo): void {
    const mods = this._store.getSelectedMods();
    this._agregarArticulo(art, mods);
  }

  /**
   * Agrega el artículo al store (optimista), lo persiste en BD inmediatamente
   * y lo emite via socket para que otros camareros de la misma mesa lo vean.
   */
  /**
   * Agrega el artículo al store (optimista), persiste en BD de inmediato
   * y emite via socket para que otros camareros de la misma mesa lo vean.
   */
  private _agregarArticulo(
    art: import('./mesas.types').Articulo,
    mods: import('./mesas.types').OpcionModificador[],
  ): void {
    const { ordenId, mesaId } = this._store.state;
    if (!ordenId) return;

    // 1. Agregar al store de forma optimista → devuelve el ID usado
    const idUsado = this._store.agregarLinea(art, mods);
    toast(art.nombre + ' agregado', 'success');
    this._tpv.renderOrden();

    const linea = this._store.state.lineas.find(l => l.id === idUsado);
    if (!linea) return;

    // 2a. Línea agrupada con una ya persistida en BD → PATCH cantidad
    if (idUsado > 0) {
      // Asegurar que quede en lineasNuevasIds para que _enviarCocina la incluya
      this._store.marcarComoNueva(idUsado);
      updateLinea(ordenId, idUsado, {
        cantidad:       linea.cantidad,
        subtotal_linea: linea.subtotal_linea,
      }).then(() => {
        if (mesaId) {
          posSocket.emitLineaSincronizada({ orden_id: ordenId, mesa_id: mesaId, accion: 'update', linea });
        }
      }).catch(() => {});
      return;
    }

    // 2b. Línea nueva (temp ID negativo) → POST, luego confirmar y emitir
    createLinea(ordenId, {
      articulo_id:     linea.articulo_id,
      cantidad:        linea.cantidad,
      precio_unitario: linea.precio_unitario,
      subtotal_linea:  linea.subtotal_linea,
      cuenta_num:      linea.cuenta_num,
      notas_linea:     linea.notas_linea,
      modificadores:   linea.modificadores.map(m => ({
        modificador_id: m.modificador_id,
        precio_extra:   m.precio_extra,
      })),
    })
      .then(lineaReal => {
        // Preservar los valores financieros calculados localmente (precio con mods incluidos).
        // El backend puede devolver solo el precio base sin los extras de modificadores.
        const lineaConfirmada: typeof lineaReal = {
          ...linea,                // valores optimistas (precio, subtotal, mods, nombre)
          id:       lineaReal.id,  // único campo que necesitamos del backend
          orden_id: lineaReal.orden_id,
          nombre_articulo: linea.nombre_articulo || art.nombre,
        };
        this._store.confirmarLineaPersistida(idUsado, lineaConfirmada);
        this._tpv.renderOrden();
        if (mesaId) {
          posSocket.emitLineaSincronizada({ orden_id: ordenId, mesa_id: mesaId, accion: 'add', linea: lineaConfirmada });
        }
      })
      .catch(() => {
        this._store.eliminarLinea(idUsado);
        toast('Error al guardar ' + art.nombre, 'error');
        this._tpv.renderOrden();
      });
  }

  // ─── Canales inter-módulos ────────────────────────────────────────────────

  private _subscribeChannels(): void {
    // Escuchar mesa liberada desde caja (mismo tab, fallback a socket)
    mesasChannel.on(msg => {
      if (msg.tipo === 'mesa_liberada') {
        this._store.patchMesa(msg.mesaId, { estado: 'libre', personas: 0 });
        if (document.getElementById('screen-mesas')?.classList.contains('active')) {
          this._floorPlan.renderMesas();
        }
      }
    });

    // Fallback: storage event (diferente tab, mismo dispositivo)
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

(window as unknown as Record<string, unknown>)['fmt'] = fmt;
