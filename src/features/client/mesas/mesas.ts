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
import type { Mesa, Orden, LineaOrden } from './mesas.types';
import {
  getZonas, getMesasByZona, getFamilias, getArticulos, getAllArticulos, getModificadores,
  getImpuestosSucursal,
  createOrden, getOrdenActivaMesa, getUltimaOrdenMesa, getLineas,
  createLinea, updateLinea, deleteLinea, updateOrden,
  marcarOrdenEnPreparacion, marcarOrdenPorCobrar,
  patchEstadoMesa, patchMesaPersonas, patchMesaData,
} from './mesas.service';
import { fmt } from '../shared/utils/format';
import { notifStore } from '../shared/services/notificaciones.store';
import { SplitModal } from '../shared/components/split-modal';
import type { SplitConfirmResult } from '../shared/components/split-modal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reintenta buscar la orden activa hasta 3 veces con espera progresiva.
 *  Necesario porque el socket puede marcar la mesa como "ocupada" antes de que
 *  la orden quede persistida en la BD. */
const fetchOrdenActivaConReintento = async (mesaId: number, intentos = 3, esperaMs = 600): Promise<Orden | null> => {
  for (let i = 0; i < intentos; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, esperaMs * i));
    const ordenes = await getOrdenActivaMesa(mesaId);
    if (ordenes.length > 0) return ordenes[0];
  }
  return null;
};

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

  private readonly _splitModal = new SplitModal();

  private _sucursalId   = 0;
  private _usuarioId    = 0;
  private _allArticulos: import('./mesas.types').Articulo[] = [];
  private _mesaAccion: Mesa | null = null;
  private _miRol        = '';
  private _cuentaNombreNum = 0;
  private _longPressTimer: ReturnType<typeof setTimeout> | null = null;

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
    this._wireNotifDrawer();
    this._subscribeChannels();
    this._updateNotifBadge();
  }

  private _applyTheme(): void {
    document.documentElement.style.setProperty('--accent',     '#d63050');
    document.documentElement.style.setProperty('--accent-rgb', '214,48,80');
    document.documentElement.style.setProperty('--accent2',    '#f04f5a');
  }

  // ─── Liberación de mesa (con separación automática de unidas) ────────────

  private _liberarMesaConUnidas(mesaId: number): void {
    // Liberar la mesa principal
    this._store.patchMesa(mesaId, { estado: 'libre', personas: 0, mesa_principal_id: undefined });

    // Buscar y liberar todas las mesas secundarias vinculadas a esta
    const unidas = this._store.state.mesas.filter(m => m.mesa_principal_id === mesaId);
    for (const m of unidas) {
      this._store.patchMesa(m.id, { estado: 'libre', personas: 0, mesa_principal_id: undefined });
      patchMesaData(m.id, { estado: 'libre', mesa_principal_id: null }).catch(() => {});
    }

    if (document.getElementById('screen-mesas')?.classList.contains('active')) {
      this._floorPlan.renderMesas();
    }
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
        if (mesa_id == null) return;
        this._liberarMesaConUnidas(mesa_id);
        toast('Mesa liberada — pago registrado', 'success');
      });

      // caja:orden_anulada
      posSocket.onCajaOrdenAnulada(({ mesa_id }) => {
        this._liberarMesaConUnidas(mesa_id);
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

      // KDS batch listo → notificar al camarero
      posSocket.onKdsBatchListo(payload => {
        notifStore.agregar(payload);
        this._updateNotifBadge();
        this._floorPlan.renderMesas();
        // Si el camarero está en el TPV de esta orden, actualizar estados de líneas
        if (payload.orden_id === this._store.state.ordenId && payload.orden_linea_ids?.length) {
          this._store.marcarLineasListas(payload.orden_linea_ids);
          this._tpv.renderOrden();
        }
        toast(`🔔 ${payload.mesa} — pedido listo para recoger`, 'success');
      });

      // KDS lineas entregadas (confirmación del backend)
      posSocket.onKdsLineasEntregadas(({ orden_id, orden_linea_ids }) => {
        // Quitar notificaciones de cualquier camarero que haya recogido estas líneas
        if (orden_linea_ids?.length) {
          notifStore.marcarPorLineas(orden_linea_ids);
          this._updateNotifBadge();
        }
        if (orden_id === this._store.state.ordenId && orden_linea_ids?.length) {
          this._store.marcarLineasEntregadas(orden_linea_ids);
          if (document.getElementById('screen-tpv')?.classList.contains('active')) {
            this._tpv.renderOrden();
          }
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
      // Mesa ocupada — cargar la orden activa desde la BD.
      // Si la mesa es secundaria (unida), la orden está bajo la mesa principal.
      const mesaOrdenId = mesa.mesa_principal_id ?? mesaId;
      fetchOrdenActivaConReintento(mesaOrdenId)
        .then(orden => {
          if (!orden) {
            this._store.setCargando(false);
            getUltimaOrdenMesa(mesaOrdenId).then(ultima => {
              const estadoUltima = ultima?.estado;
              let mensaje: string;
              if (!ultima) {
                mensaje = `La mesa "${mesa.nombre}" aparece ocupada pero nunca tuvo una orden.\n\nPuedes liberarla sin riesgo. ¿Liberar?`;
              } else if (estadoUltima === 'cobrada') {
                mensaje = `La mesa "${mesa.nombre}" ya fue cobrada pero no se liberó correctamente.\n\nPuedes liberarla sin riesgo. ¿Liberar?`;
              } else if (estadoUltima === 'cancelada') {
                mensaje = `La mesa "${mesa.nombre}" tiene una orden cancelada y no se liberó.\n\nPuedes liberarla sin riesgo. ¿Liberar?`;
              } else {
                mensaje = `La mesa "${mesa.nombre}" aparece ocupada pero no se encontró su orden activa (estado: ${estadoUltima ?? 'desconocido'}).\n\n⚠️ Puede haber artículos en curso. Consulta con un supervisor antes de liberar.\n\n¿Liberar de todas formas?`;
              }
              if (confirm(mensaje)) {
                patchEstadoMesa(mesaId, 'libre')
                  .then(() => {
                    this._store.patchMesa(mesaId, { estado: 'libre', personas: 0, mesa_principal_id: undefined });
                    this._floorPlan.renderMesas();
                    toast('Mesa liberada', 'success');
                  })
                  .catch(() => toast('Error al liberar la mesa', 'error'));
              }
            });
            return;
          }
          return getLineas(orden.id).then(lineas => {
            const personas = mesa.personas ?? lineas.length;
            this._store.openTPV(mesaId, mesa.nombre, personas, orden);
            this._store.setLineas(lineas);
            this._store.restoreSplitFromLineas();
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
        mesaId: number; id: number; orden: Orden; lineas: LineaOrden[];
        numComensales: number; splitMode: boolean; numCuentas: number;
      }>;
      const ticket = queue.find(t => t.mesaId === mesaId);
      if (ticket) {
        const mesa = this._store.getMesa(mesaId)!;
        this._store.openTPV(mesaId, mesa.nombre, ticket.numComensales, ticket.orden);
        this._store.setLineas(ticket.lineas);
        this._store.restoreSplitFromLineas();
        posSocket.emitUsuarioEntro(mesaId);
        this._loadTPVScreen();
      } else {
        // Cola vacía (cobro falló o fue interrumpido) — cargar desde la API
        const mesa = this._store.getMesa(mesaId)!;
        this._store.setCargando(true);
        fetchOrdenActivaConReintento(mesaId)
          .then(orden => {
            if (!orden) {
              toast('No se encontró orden activa para esta mesa', 'error');
              this._store.setCargando(false);
              return;
            }
            return getLineas(orden.id).then(lineas => {
              const personas = mesa.personas ?? lineas.length;
              this._store.openTPV(mesaId, mesa.nombre, personas, orden);
              this._store.setLineas(lineas);
              this._store.restoreSplitFromLineas();
              posSocket.emitUsuarioEntro(mesaId);
              this._loadTPVScreen();
            });
          })
          .catch(() => toast('Error al cargar la orden'))
          .finally(() => this._store.setCargando(false));
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
        // Marcar ocupada solo localmente; el broadcast se hace al enviar a cocina
        this._store.patchMesa(mesa.id, { estado: 'ocupada', personas: numComensales });
        this._store.openTPV(mesa.id, mesa.nombre, numComensales, orden);
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

    // Resetear búsqueda al abrir un nuevo TPV
    this._allArticulos = [];
    const searchInput = document.getElementById('articulos-search-input') as HTMLInputElement | null;
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('articulos-search-clear') as HTMLElement | null;
    if (clearBtn) clearBtn.style.display = 'none';

    // Cargar todos los artículos en paralelo para la búsqueda cross-familia
    getAllArticulos().then(arts => { this._allArticulos = arts; }).catch(() => {});

    this._store.setCargando(true);
    getImpuestosSucursal(this._sucursalId)
      .then(impuestos => {
        this._store.setImpuestos(impuestos);
        // Re-renderizar totales ahora que las tasas están disponibles
        this._tpv.renderTotales();
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
      const { mesaId, lineas, ordenId } = this._store.state;
      // Si no hay nada digitado, liberar y cancelar la orden vacía automáticamente
      if (!lineas.length && ordenId) {
        updateOrden(ordenId, { estado: 'cancelada' }).catch(() => {});
        if (mesaId) {
          patchEstadoMesa(mesaId, 'libre').catch(() => {});
          this._liberarMesaConUnidas(mesaId);
        }
      }
      if (mesaId) posSocket.emitUsuarioSalio(mesaId);
      this._store.resetTPV();
      this._floorPlan.renderMesas();
      this._goTo('mesas');
    });

    // ── TPV: buscador de artículos ──
    const normalize = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const applySearch = (term: string) => {
      const clearBtn = document.getElementById('articulos-search-clear') as HTMLElement | null;
      if (clearBtn) clearBtn.style.display = term ? '' : 'none';
      if (term.trim()) {
        const q = normalize(term.trim());
        this._store.setArticulos(this._allArticulos.filter(a => normalize(a.nombre).includes(q)));
        this._tpv.renderArticulos();
      } else {
        this._loadArticulos();
      }
    };

    document.getElementById('articulos-search-input')?.addEventListener('input', e => {
      applySearch((e.target as HTMLInputElement).value);
    });

    document.getElementById('articulos-search-clear')?.addEventListener('click', () => {
      const input = document.getElementById('articulos-search-input') as HTMLInputElement | null;
      if (input) { input.value = ''; input.focus(); }
      applySearch('');
    });

    // ── TPV: familias ──
    document.getElementById('familias-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-familia]');
      if (!btn) return;
      const input = document.getElementById('articulos-search-input') as HTMLInputElement | null;
      if (input) input.value = '';
      applySearch('');
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

    // ── TPV: long press en badge de cuenta → modal nombre (o acción para admin) ──
    document.getElementById('orden-lineas')?.addEventListener('pointerdown', e => {
      const badge = (e.target as HTMLElement).closest<HTMLElement>('[data-ciclar]');
      if (!badge) return;
      this._longPressTimer = setTimeout(() => {
        this._longPressTimer = null;
        const lineaId = Number(badge.dataset.ciclar);
        const linea   = this._store.state.lineas.find(l => l.id === lineaId);
        if (!linea) return;
        this._lineaAccionId = lineaId;
        this._abrirModalCuentaNombre(linea.cuenta_num || 1);
      }, 500);
    });
    document.getElementById('orden-lineas')?.addEventListener('pointerup', () => {
      if (this._longPressTimer) { clearTimeout(this._longPressTimer); this._longPressTimer = null; }
    });
    document.getElementById('orden-lineas')?.addEventListener('pointermove', () => {
      if (this._longPressTimer) { clearTimeout(this._longPressTimer); this._longPressTimer = null; }
    });

    // ── Modal nota de línea ──
    document.querySelector('[data-cerrar-nota-linea]')?.addEventListener('click', () => {
      this._cerrarModalNotaLinea();
    });
    document.querySelector('[data-confirmar-nota-linea]')?.addEventListener('click', () => {
      this._confirmarNotaLinea();
    });
    document.getElementById('nota-linea-input')?.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._cerrarModalNotaLinea();
    });

    // ── Modal nombre cuenta ──
    document.querySelector('[data-cerrar-cuenta-nombre]')?.addEventListener('click', () => {
      this._cerrarModalCuentaNombre();
    });
    document.querySelector('[data-confirmar-cuenta-nombre]')?.addEventListener('click', () => {
      this._confirmarCuentaNombre();
    });
    document.getElementById('cuenta-nombre-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._confirmarCuentaNombre();
      if (e.key === 'Escape') this._cerrarModalCuentaNombre();
    });

    // ── TPV: orden (líneas) ──
    document.getElementById('orden-lineas')?.addEventListener('click', e => {
      const target = e.target as HTMLElement;

      const notaLinea = target.closest<HTMLElement>('[data-nota-linea]');
      if (notaLinea) {
        e.stopPropagation();
        this._abrirModalNotaLinea(Number(notaLinea.dataset.notaLinea));
        return;
      }

      const ciclar = target.closest<HTMLElement>('[data-ciclar]');
      if (ciclar) {
        e.stopPropagation();
        const lineaId = Number(ciclar.dataset.ciclar);
        this._store.ciclarCuenta(lineaId);
        // Persistir cuenta_num en BD si la línea ya existe
        const linea = this._store.state.lineas.find(l => l.id === lineaId);
        if (linea && linea.id > 0) {
          const { ordenId } = this._store.state;
          updateLinea(ordenId ?? 0, lineaId, { cuenta_num: linea.cuenta_num })
            .then(() => this._emitirSplitSiPorCobrar())
            .catch(() => {});
        }
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
    document.getElementById('btn-split')?.addEventListener('click', () => this._openSplitModal());
    document.querySelector('[data-liberar-mesa]')?.addEventListener('click', () => this._liberarMesaVacia());

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

    // ── Modal acción cuenta (admin/encargado) ──
    document.getElementById('btn-accion-cuenta-nombre')?.addEventListener('click', () => {
      this._cerrarModalAccionCuenta();
      this._mostrarModalNombreCuenta(this._cuentaNombreNum);
    });
    document.getElementById('btn-accion-cuenta-mover')?.addEventListener('click', () => {
      this._abrirModalMoverMesa();
    });
    document.getElementById('btn-cerrar-accion-cuenta')?.addEventListener('click', () => {
      this._cerrarModalAccionCuenta();
    });

    // ── Modal mover artículo a otra mesa ──
    document.getElementById('btn-cerrar-mover-mesa')?.addEventListener('click', () => {
      this._cerrarModalMoverMesa();
    });
    document.getElementById('mover-mesa-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-mover-mesa]');
      if (!btn) return;
      const targetMesaId = Number(btn.dataset.moverMesa);
      this._cerrarModalMoverMesa();
      this._moverLineaAMesa(this._lineaAccionId, targetMesaId);
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
        this._store.marcarEnviadas(linea_ids);
        this._store.setOrdenCompleta(false); // esperar confirmación de KDS
        // Persistir estado 'ocupada' en BD solo al primer envío a cocina
        const { mesaId } = this._store.state;
        if (mesaId) patchEstadoMesa(mesaId, 'ocupada').catch(() => {});
        toast('Enviado a cocina ✓', 'success');
        this._tpv.renderOrden();
      })
      .catch(() => toast('Error al enviar a cocina'))
      .finally(() => this._store.setCargando(false));
  }

  private _liberarMesaVacia(): void {
    const { lineas, ordenId, mesaId } = this._store.state;
    if (lineas.length) {
      toast('No se puede liberar: hay artículos en la orden', 'error');
      return;
    }
    if (!confirm('¿Liberar la mesa? Se cancelará la orden vacía.')) return;

    this._store.setCargando(true);
    const cancelar = ordenId
      ? updateOrden(ordenId, { estado: 'cancelada' }).catch(() => {})
      : Promise.resolve();

    cancelar
      .then(() => {
        if (mesaId) {
          patchEstadoMesa(mesaId, 'libre').catch(() => {});
          posSocket.emitUsuarioSalio(mesaId);
          this._liberarMesaConUnidas(mesaId);
        }
        this._store.resetTPV();
        this._goTo('mesas');
        this._floorPlan.renderMesas();
        toast('Mesa liberada', 'success');
      })
      .catch(() => toast('Error al liberar la mesa', 'error'))
      .finally(() => this._store.setCargando(false));
  }

  private _pedirCuenta(): void {
    const { lineas, ordenId, mesaId, mesaLabel, numComensales, orden, splitMode, numCuentas } = this._store.state;
    if (!lineas.length) { toast('La orden está vacía'); return; }
    if (!ordenId || !mesaId) return;

    const btn = document.querySelector<HTMLButtonElement>('[data-pedir-cuenta]');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.45'; }

    this._store.setCargando(true);
    marcarOrdenPorCobrar(ordenId)
      .then(() => {
        const { cuentasNombres } = this._store.state;
        const ticket = {
          id: ordenId, mesaId, mesaLabel, numComensales,
          orden: { ...orden },
          lineas: lineas.map(l => ({ ...l })),
          splitMode, numCuentas,
          cuentasNombres: { ...cuentasNombres },
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
      .catch(() => {
        toast('Error al solicitar la cuenta');
        if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      })
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

  // ─── Notificaciones de entrega ────────────────────────────────────────────

  private _updateNotifBadge(): void {
    const mias    = notifStore.contarMias(this._usuarioId);
    const globales = notifStore.contarGlobales(this._usuarioId);
    const btn     = document.getElementById('btn-notif');
    const badge   = document.getElementById('notif-count');
    const dot     = document.getElementById('notif-dot');
    if (!btn || !badge) return;
    if (mias > 0) {
      badge.textContent = String(mias);
      badge.style.display = 'flex';
      btn.classList.add('has-notif');
    } else {
      badge.style.display = 'none';
      btn.classList.remove('has-notif');
    }
    // Punto indicador para globales sin atender
    if (dot) dot.style.display = globales > 0 ? 'block' : 'none';
  }

  private _openNotifDrawer(): void {
    this._renderNotifDrawer();
    document.getElementById('notif-overlay')!.style.display = 'block';
    document.getElementById('notif-drawer')!.classList.add('open');
  }

  private _closeNotifDrawer(): void {
    document.getElementById('notif-overlay')!.style.display = 'none';
    document.getElementById('notif-drawer')!.classList.remove('open');
  }

  private _tabNotif: 'mias' | 'todas' = 'mias';

  private _renderNotifDrawer(): void {
    const list = document.getElementById('notif-list');
    if (!list) return;

    const mias     = notifStore.getMias(this._usuarioId);
    const globales = notifStore.getGlobales(this._usuarioId);
    const entregas = this._tabNotif === 'mias' ? mias : notifStore.getAll();

    const fmtHora = (ts: number) =>
      new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

    const renderItems = (items: typeof entregas) =>
      items.length
        ? items.map(e => `
            <div class="notif-item ${e.usuario_id !== this._usuarioId ? 'notif-global' : ''}">
              <div class="notif-item-header">
                <span class="notif-item-mesa">🍽 ${e.mesa}</span>
                <span class="notif-item-hora">${fmtHora(e.timestamp)}</span>
              </div>
              <ul class="notif-item-arts">
                ${e.articulos.map(a => `<li><strong>${a.cantidad}x</strong>&nbsp;${a.nombre}</li>`).join('')}
              </ul>
              <button class="btn-recibido" data-recibido="${e.id}">✓ Marcar recibido</button>
            </div>`).join('')
        : '<div class="notif-empty">Sin entregas pendientes</div>';

    list.innerHTML = `
      <div class="notif-tabs">
        <button class="notif-tab ${this._tabNotif === 'mias' ? 'active' : ''}" data-tab="mias">
          Mis entregas${mias.length ? ` <span class="notif-tab-count">${mias.length}</span>` : ''}
        </button>
        <button class="notif-tab ${this._tabNotif === 'todas' ? 'active' : ''}" data-tab="todas">
          Ver todas${globales.length ? ` <span class="notif-tab-count notif-tab-count-global">${globales.length}</span>` : ''}
        </button>
      </div>
      <div class="notif-items">
        ${renderItems(entregas)}
      </div>
    `;

    // Tabs click
    list.querySelectorAll<HTMLElement>('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._tabNotif = btn.dataset.tab as 'mias' | 'todas';
        this._renderNotifDrawer();
      });
    });
  }

  private _wireNotifDrawer(): void {
    document.getElementById('btn-notif')?.addEventListener('click', () => this._openNotifDrawer());
    document.getElementById('notif-close')?.addEventListener('click', () => this._closeNotifDrawer());
    document.getElementById('notif-overlay')?.addEventListener('click', () => this._closeNotifDrawer());
    document.getElementById('notif-list')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-recibido]');
      if (!btn) return;
      const id = btn.dataset.recibido!;
      const entrega = notifStore.getAll().find(x => x.id === id);
      if (entrega?.orden_linea_ids?.length) {
        posSocket.emitLineasEntregadas(entrega.orden_linea_ids);
        // Actualizar local inmediatamente (optimista)
        if (entrega.orden_id === this._store.state.ordenId) {
          this._store.marcarLineasEntregadas(entrega.orden_linea_ids);
          if (document.getElementById('screen-tpv')?.classList.contains('active')) {
            this._tpv.renderOrden();
          }
        }
      }
      notifStore.marcarRecibida(id);
      this._updateNotifBadge();
      this._renderNotifDrawer();
      this._floorPlan.renderMesas();
    });
  }

  // ─── Modal de división (staged editing) ──────────────────────────────────────

  private _openSplitModal(): void {
    const { mesaLabel, lineas, numCuentas, cuentasNombres, numComensales, impuestos } = this._store.state;

    this._splitModal.open({
      mesaLabel: mesaLabel ?? '',
      lineas: lineas.map(l => ({ ...l, modificadores: (l.modificadores ?? []).map(m => ({ nombre_modificador: m.nombre_modificador })) })),
      numCuentas,
      cuentasNombres: { ...cuentasNombres },
      maxCuentas: Math.max(numComensales || 2, 2),
      impuestos: impuestos.map(i => ({ nombre: i.impuesto?.nombre ?? '', porcentaje: Number(i.impuesto?.porcentaje ?? 0) })),
      onConfirm: (result: SplitConfirmResult) => this._aplicarSplitModalResult(result),
      onCancel: () => {},
    });
  }

  private async _aplicarSplitModalResult(result: SplitConfirmResult): Promise<void> {
    const { ordenId, mesaId, lineas } = this._store.state;

    // Capturar cuenta_num originales antes de que applySplitResult mute los objetos
    const cuentaNumAntes = new Map(lineas.map(l => [l.id, l.cuenta_num ?? 1]));

    // 1. Aplicar al store (actualiza lineas, splitMode, numCuentas, cuentasNombres)
    this._store.applySplitResult(result);

    // 2. Persistir en BD solo las líneas cuyo cuenta_num cambió
    result.lineas.forEach(r => {
      if (r.id > 0 && cuentaNumAntes.get(r.id) !== r.cuenta_num) {
        updateLinea(ordenId ?? 0, r.id, { cuenta_num: r.cuenta_num })
          .catch(() => {});
      }
    });

    // 3. Manejar desgloses: partir líneas agrupadas en unidades individuales
    if (result.desglosadas.length > 0 && ordenId) {
      await Promise.all(result.desglosadas.map(async d => {
        const full = lineas.find(l => l.id === d.originalId);
        if (!full) return;
        const subtotalUnit = Math.round(full.precio_unitario * 100) / 100;

        await updateLinea(ordenId, d.originalId, {
          cantidad:       1,
          subtotal_linea: subtotalUnit,
          cuenta_num:     d.cuentaNums[0],
        }).catch(() => {});

        for (let i = 1; i < d.cuentaNums.length; i++) {
          await createLinea(ordenId, {
            articulo_id:      full.articulo_id,
            cantidad:         1,
            precio_unitario:  full.precio_unitario,
            subtotal_linea:   subtotalUnit,
            cuenta_num:    d.cuentaNums[i],
            notas_linea:   full.notas_linea,
            modificadores: full.modificadores.map(m => ({ modificador_id: m.modificador_id, precio_extra: m.precio_extra })),
          }).catch(() => {});
        }
      }));

      // Recargar líneas desde servidor para obtener los IDs reales de las nuevas líneas
      const freshLineas = await getLineas(ordenId).catch(() => null);
      if (freshLineas) {
        this._store.setLineas(freshLineas);
        this._store.restoreSplitFromLineas();
      }
    }

    // 4. Emitir por socket/BroadcastChannel si la orden ya es por_cobrar
    this._emitirSplitSiPorCobrar();

    // 5. Re-renderizar TPV
    this._tpv.renderOrden();

    if (mesaId) posSocket.emitUsuarioEntro(mesaId);
  }

  // ─── Emisión split en tiempo real ────────────────────────────────────────────

  /** Emite el estado actual de split por socket y BroadcastChannel si la orden es por_cobrar. */
  private _emitirSplitSiPorCobrar(): void {
    const { orden, ordenId, mesaId, splitMode, numCuentas, cuentasNombres, lineas } = this._store.state;
    if (!ordenId || !mesaId) return;
    if (orden?.estado !== 'por_cobrar') return;

    const payload = {
      orden_id: ordenId,
      mesa_id: mesaId,
      split_mode: splitMode,
      num_cuentas: numCuentas,
      cuentas_nombres: { ...cuentasNombres },
      lineas: lineas.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })),
    };

    // Cross-device: socket
    posSocket.emitSplitActualizado(payload);

    // Same-device: BroadcastChannel → caja en otra pestaña
    try {
      const queue = JSON.parse(localStorage.getItem(CAJA_QUEUE_KEY) ?? '[]') as Array<{ mesaId: number }>;
      if (queue.some(t => t.mesaId === mesaId)) {
        cajaChannel.send({
          tipo: 'split_actualizado',
          ordenId,
          splitMode,
          numCuentas,
          cuentasNombres,
          lineas: lineas.map(l => ({ id: l.id, cuenta_num: l.cuenta_num || 1 })),
        });
      }
    } catch { /* ignorar */ }
  }

  // ─── Modal nombre de cuenta ───────────────────────────────────────────────

  private _abrirModalCuentaNombre(num: number): void {
    // Admin/encargado: mostrar modal de opciones primero
    if (this._miRol === 'administrador' || this._miRol === 'encargado') {
      this._cuentaNombreNum = num;
      this._abrirModalAccionCuenta(num);
      return;
    }
    this._mostrarModalNombreCuenta(num);
  }

  private _mostrarModalNombreCuenta(num: number): void {
    this._cuentaNombreNum = num;
    const titulo = document.getElementById('cuenta-nombre-titulo');
    if (titulo) titulo.textContent = `Cuenta ${num}`;
    const input = document.getElementById('cuenta-nombre-input') as HTMLInputElement | null;
    if (input) {
      input.value = this._store.state.cuentasNombres[num] ?? '';
    }
    document.getElementById('modal-cuenta-nombre')!.style.display = 'flex';
    setTimeout(() => input?.focus(), 50);
  }

  private _cerrarModalCuentaNombre(): void {
    document.getElementById('modal-cuenta-nombre')!.style.display = 'none';
  }

  private _confirmarCuentaNombre(): void {
    const input = document.getElementById('cuenta-nombre-input') as HTMLInputElement | null;
    const nombre = input?.value ?? '';
    this._store.setCuentaNombre(this._cuentaNombreNum, nombre);
    this._cerrarModalCuentaNombre();
    this._tpv.renderOrden();
    this._emitirSplitSiPorCobrar();
  }

  // ─── Modal acción cuenta (admin/encargado) ────────────────────────────────────

  // ─── Modal nota de línea ──────────────────────────────────────────────────────

  private _notaLineaId = 0;

  private _abrirModalNotaLinea(lineaId: number): void {
    this._notaLineaId = lineaId;
    const linea = this._store.state.lineas.find(l => l.id === lineaId);
    const textarea = document.getElementById('nota-linea-input') as HTMLTextAreaElement | null;
    if (textarea) textarea.value = linea?.notas_linea ?? '';
    document.getElementById('modal-nota-linea')!.style.display = 'flex';
    setTimeout(() => textarea?.focus(), 50);
  }

  private _cerrarModalNotaLinea(): void {
    document.getElementById('modal-nota-linea')!.style.display = 'none';
  }

  private _confirmarNotaLinea(): void {
    const textarea = document.getElementById('nota-linea-input') as HTMLTextAreaElement | null;
    const nota = textarea?.value.trim() ?? '';
    this._store.setNotaLinea(this._notaLineaId, nota);
    this._cerrarModalNotaLinea();
    const linea = this._store.state.lineas.find(l => l.id === this._notaLineaId);
    const { ordenId, mesaId } = this._store.state;
    if (linea && linea.id > 0 && ordenId) {
      updateLinea(ordenId, linea.id, { notas_linea: nota || undefined }).catch(() => {});
      if (mesaId) {
        posSocket.emitLineaSincronizada({ orden_id: ordenId, mesa_id: mesaId, accion: 'update', linea: { ...linea, notas_linea: nota || undefined } });
      }
    }
    this._tpv.renderOrden();
  }

  private _lineaAccionId = 0; // ID de la línea sobre la que se hizo long-press

  private _abrirModalAccionCuenta(num: number): void {
    const modal = document.getElementById('modal-accion-cuenta');
    if (!modal) return;
    const titulo = document.getElementById('accion-cuenta-titulo');
    if (titulo) titulo.textContent = `Cuenta ${num}`;
    modal.style.display = 'flex';
  }

  private _cerrarModalAccionCuenta(): void {
    const modal = document.getElementById('modal-accion-cuenta');
    if (modal) modal.style.display = 'none';
  }

  // ─── Mover artículo a otra mesa ──────────────────────────────────────────────

  private _abrirModalMoverMesa(): void {
    this._cerrarModalAccionCuenta();
    const modal = document.getElementById('modal-mover-mesa');
    if (!modal) return;

    // Mostrar solo mesas ocupadas/por_cobrar (con orden activa) excepto la actual
    const { mesaId } = this._store.state;
    const mesas = this._store.state.mesas.filter(m =>
      m.id !== mesaId && (m.estado === 'ocupada' || m.estado === 'por_cobrar'),
    );

    const grid = document.getElementById('mover-mesa-grid');
    if (grid) {
      grid.innerHTML = mesas.length
        ? mesas.map(m => `
            <button class="btn-mover-mesa-item" data-mover-mesa="${m.id}">
              <span style="font-weight:700">${m.nombre}</span>
              <span style="font-size:11px;color:var(--text-muted)">${m.estado === 'por_cobrar' ? 'Por cobrar' : 'Ocupada'}</span>
            </button>`).join('')
        : '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">Sin mesas disponibles</div>';
    }

    modal.style.display = 'flex';
  }

  private _cerrarModalMoverMesa(): void {
    const modal = document.getElementById('modal-mover-mesa');
    if (modal) modal.style.display = 'none';
  }

  private _moverLineaAMesa(lineaId: number, targetMesaId: number): void {
    const { ordenId, mesaId, lineas } = this._store.state;
    const linea = lineas.find(l => l.id === lineaId);
    if (!linea || !ordenId || !mesaId) return;

    this._store.setCargando(true);
    getOrdenActivaMesa(targetMesaId)
      .then(ordenes => {
        const targetOrden = ordenes[0];
        if (!targetOrden) {
          toast('La mesa destino no tiene una orden activa', 'error');
          return;
        }
        return createLinea(targetOrden.id, {
          articulo_id:     linea.articulo_id,
          cantidad:        linea.cantidad,
          precio_unitario: linea.precio_unitario,
          subtotal_linea:  linea.subtotal_linea,
          cuenta_num:      1,
          notas_linea:     linea.notas_linea,
          modificadores:   linea.modificadores.map(m => ({
            modificador_id: m.modificador_id,
            precio_extra:   m.precio_extra,
          })),
        }).then(nuevaLinea => {
          if (linea.id > 0) deleteLinea(ordenId, linea.id).catch(() => {});
          this._store.eliminarLinea(lineaId);
          posSocket.emitLineaSincronizada({ orden_id: ordenId, mesa_id: mesaId, accion: 'delete', linea });
          posSocket.emitLineaSincronizada({ orden_id: targetOrden.id, mesa_id: targetMesaId, accion: 'add', linea: nuevaLinea });
          const nombre = this._store.getMesa(targetMesaId)?.nombre ?? 'la mesa';
          toast(`Artículo movido a ${nombre} ✓`, 'success');
          this._tpv.renderOrden();
        });
      })
      .catch(() => toast('Error al mover artículo', 'error'))
      .finally(() => this._store.setCargando(false));
  }

  // ─── Canales inter-módulos ────────────────────────────────────────────────

  private _subscribeChannels(): void {
    // Escuchar mesa liberada desde caja (mismo tab, fallback a socket)
    mesasChannel.on(msg => {
      if (msg.tipo === 'mesa_liberada') {
        this._liberarMesaConUnidas(msg.mesaId);
      }
    });

    // Fallback: storage event (diferente tab, mismo dispositivo)
    window.addEventListener('storage', e => {
      if (e.key !== MESAS_UPDATE_KEY) return;
      try {
        const updates = JSON.parse(e.newValue ?? '[]') as Array<{ mesaId: number; estado: string }>;
        updates.forEach(u => {
          if (u.estado === 'libre') {
            this._liberarMesaConUnidas(u.mesaId);
          } else {
            this._store.patchMesa(u.mesaId, { estado: u.estado as Mesa['estado'] });
          }
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
