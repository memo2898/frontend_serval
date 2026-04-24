import { io, Socket } from 'socket.io-client';
import { SERVER_ROUTE } from '@/config';
import type {
  MesaPresenciaInicialPayload,
  MesaPresenciaEventPayload,
  MesaEstadoCambioPayload,
  KdsNuevaLineaPayload,
  KdsOrdenCompletaPayload,
  KdsBatchListoPayload,
  KdsLineasEntregadasPayload,
  CajaOrdenListaCobrarPayload,
  CajaPagoRegistradoPayload,
  CajaTurnoPayload,
  CajaOrdenAnuladaPayload,
  ErrorEventoPayload,
  OrdenLineasConfirmadasPayload,
  OrdenLineaSincronizadaPayload,
  OrdenSplitActualizadoPayload,
} from '../../mesas/mesas.types';

// ─── Tipos de eventos ─────────────────────────────────────────────────────────

// Cliente → Servidor
interface ClientToServerEvents {
  'mesa:usuario_entro':        (data: { mesa_id: number; personas?: number }) => void;
  'mesa:usuario_salio':        (data: { mesa_id: number }) => void;
  'mesa:mesas_unidas':         (data: { principal_id: number; mesas_ids: number[] }) => void;
  'mesa:orden_movida':         (data: { source_mesa_id: number; target_mesa_id: number; personas: number }) => void;
  'orden:enviar_a_cocina':     (data: { orden_id: number; linea_ids: number[] }) => void;
  'orden:linea_sincronizada':  (data: OrdenLineaSincronizadaPayload) => void;
  'orden:split_actualizado':   (data: OrdenSplitActualizadoPayload) => void;
  'kds:linea_en_preparacion':  (data: { kds_orden_id: number }) => void;
  'kds:linea_lista':           (data: { kds_orden_id: number }) => void;
  'kds:batch_lista':           (data: { kds_orden_ids: number[] }) => void;
  'kds:lineas_entregadas':     (data: { orden_linea_ids: number[] }) => void;
}

// Servidor → Cliente
interface ServerToClientEvents {
  'mesa:presencia_actual':     (data: MesaPresenciaInicialPayload) => void;
  'mesa:usuario_entro':        (data: MesaPresenciaEventPayload) => void;
  'mesa:usuario_salio':        (data: { mesa_id: number; usuario_id: number }) => void;
  'mesa:estado_cambio':        (data: MesaEstadoCambioPayload) => void;
  'kds:nueva_linea':           (data: KdsNuevaLineaPayload) => void;
  'kds:orden_completa':        (data: KdsOrdenCompletaPayload) => void;
  'kds:batch_listo':           (data: KdsBatchListoPayload) => void;
  'kds:lineas_entregadas':     (data: KdsLineasEntregadasPayload) => void;
  'orden:lineas_confirmadas':  (data: OrdenLineasConfirmadasPayload) => void;
  'orden:linea_sincronizada':  (data: OrdenLineaSincronizadaPayload) => void;
  'orden:split_actualizado':   (data: OrdenSplitActualizadoPayload) => void;
  'caja:orden_lista_cobrar':   (data: CajaOrdenListaCobrarPayload) => void;
  'caja:pago_registrado':      (data: CajaPagoRegistradoPayload) => void;
  'caja:turno_abierto':        (data: CajaTurnoPayload) => void;
  'caja:turno_cerrado':        (data: CajaTurnoPayload) => void;
  'caja:orden_anulada':        (data: CajaOrdenAnuladaPayload) => void;
  'error:evento':              (data: ErrorEventoPayload) => void;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export class PosSocketService {
  private _socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  // ─── Conexión ──────────────────────────────────────────────────────────────

  /**
   * Conecta al namespace /pos.
   * El gateway lee auth.token, auth.sucursal_id y auth.rol (sockets.gateway.ts:55-56).
   * sucursal_id debe enviarse explícitamente para no depender del fallback del gateway.
   */
  connect(token: string, sucursalId: number, rol?: string): void {
    if (this._socket?.connected) return;

    this._socket = io(`${SERVER_ROUTE}/pos`, {
      transports: ['websocket', 'polling'],
      auth: { token, sucursal_id: sucursalId, rol: rol ?? '' },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this._socket.on('connect', () => {
      console.log('[POS Socket] Conectado', this._socket?.id);
      document.dispatchEvent(new CustomEvent('pos-socket:connected'));
    });

    this._socket.on('disconnect', (reason) => {
      console.warn('[POS Socket] Desconectado:', reason);
      document.dispatchEvent(new CustomEvent('pos-socket:disconnected', { detail: { reason } }));
    });

    this._socket.on('connect_error', (err) => {
      console.error('[POS Socket] Error de conexión:', err.message);
      document.dispatchEvent(new CustomEvent('pos-socket:error', { detail: { message: err.message } }));
    });
  }

  disconnect(): void {
    this._socket?.disconnect();
    this._socket = null;
  }

  get connected(): boolean {
    return this._socket?.connected ?? false;
  }

  // ─── Emisiones (Cliente → Servidor) ──────────────────────────────────────

  emitUsuarioEntro(mesaId: number, personas?: number): void {
    this._socket?.emit('mesa:usuario_entro', { mesa_id: mesaId, ...(personas !== undefined ? { personas } : {}) });
  }

  emitUsuarioSalio(mesaId: number): void {
    this._socket?.emit('mesa:usuario_salio', { mesa_id: mesaId });
  }

  emitEnviarCocina(ordenId: number, lineaIds: number[]): void {
    this._socket?.emit('orden:enviar_a_cocina', { orden_id: ordenId, linea_ids: lineaIds });
  }

  emitMesasUnidas(principalId: number, mesasIds: number[]): void {
    this._socket?.emit('mesa:mesas_unidas', { principal_id: principalId, mesas_ids: mesasIds });
  }

  emitOrdenMovida(sourceMesaId: number, targetMesaId: number, personas: number): void {
    this._socket?.emit('mesa:orden_movida', { source_mesa_id: sourceMesaId, target_mesa_id: targetMesaId, personas });
  }

  emitLineaSincronizada(data: OrdenLineaSincronizadaPayload): void {
    this._socket?.emit('orden:linea_sincronizada', data);
  }

  emitLineaEnPreparacion(kdsOrdenId: number): void {
    this._socket?.emit('kds:linea_en_preparacion', { kds_orden_id: kdsOrdenId });
  }

  emitLineaLista(kdsOrdenId: number): void {
    this._socket?.emit('kds:linea_lista', { kds_orden_id: kdsOrdenId });
  }

  emitBatchLista(kdsOrdenIds: number[]): void {
    this._socket?.emit('kds:batch_lista', { kds_orden_ids: kdsOrdenIds });
  }

  emitLineasEntregadas(ordenLineaIds: number[]): void {
    this._socket?.emit('kds:lineas_entregadas', { orden_linea_ids: ordenLineaIds });
  }

  emitSplitActualizado(data: OrdenSplitActualizadoPayload): void {
    this._socket?.emit('orden:split_actualizado', data);
  }

  // ─── Suscripciones (Servidor → Cliente) ──────────────────────────────────
  // Cada método devuelve una función de cleanup para desuscribirse.

  onMesaPresencia(cb: (data: MesaPresenciaInicialPayload) => void): () => void {
    this._socket?.on('mesa:presencia_actual', cb);
    return () => this._socket?.off('mesa:presencia_actual', cb);
  }

  onServidorUsuarioEntro(cb: (data: MesaPresenciaEventPayload) => void): () => void {
    this._socket?.on('mesa:usuario_entro', cb);
    return () => this._socket?.off('mesa:usuario_entro', cb);
  }

  onServidorUsuarioSalio(cb: (data: { mesa_id: number; usuario_id: number }) => void): () => void {
    this._socket?.on('mesa:usuario_salio', cb);
    return () => this._socket?.off('mesa:usuario_salio', cb);
  }

  onMesaEstadoCambio(cb: (data: MesaEstadoCambioPayload) => void): () => void {
    this._socket?.on('mesa:estado_cambio', cb);
    return () => this._socket?.off('mesa:estado_cambio', cb);
  }

  onKdsNuevaLinea(cb: (data: KdsNuevaLineaPayload) => void): () => void {
    this._socket?.on('kds:nueva_linea', cb);
    return () => this._socket?.off('kds:nueva_linea', cb);
  }

  onKdsOrdenCompleta(cb: (data: KdsOrdenCompletaPayload) => void): () => void {
    this._socket?.on('kds:orden_completa', cb);
    return () => this._socket?.off('kds:orden_completa', cb);
  }

  onKdsBatchListo(cb: (data: KdsBatchListoPayload) => void): () => void {
    this._socket?.on('kds:batch_listo', cb);
    return () => this._socket?.off('kds:batch_listo', cb);
  }

  onKdsLineasEntregadas(cb: (data: KdsLineasEntregadasPayload) => void): () => void {
    this._socket?.on('kds:lineas_entregadas', cb);
    return () => this._socket?.off('kds:lineas_entregadas', cb);
  }

  onCajaOrdenListaCobrar(cb: (data: CajaOrdenListaCobrarPayload) => void): () => void {
    this._socket?.on('caja:orden_lista_cobrar', cb);
    return () => this._socket?.off('caja:orden_lista_cobrar', cb);
  }

  onCajaPagoRegistrado(cb: (data: CajaPagoRegistradoPayload) => void): () => void {
    this._socket?.on('caja:pago_registrado', cb);
    return () => this._socket?.off('caja:pago_registrado', cb);
  }

  onCajaTurnoAbierto(cb: (data: CajaTurnoPayload) => void): () => void {
    this._socket?.on('caja:turno_abierto', cb);
    return () => this._socket?.off('caja:turno_abierto', cb);
  }

  onCajaTurnoCerrado(cb: (data: CajaTurnoPayload) => void): () => void {
    this._socket?.on('caja:turno_cerrado', cb);
    return () => this._socket?.off('caja:turno_cerrado', cb);
  }

  onCajaOrdenAnulada(cb: (data: CajaOrdenAnuladaPayload) => void): () => void {
    this._socket?.on('caja:orden_anulada', cb);
    return () => this._socket?.off('caja:orden_anulada', cb);
  }

  onError(cb: (data: ErrorEventoPayload) => void): () => void {
    this._socket?.on('error:evento', cb);
    return () => this._socket?.off('error:evento', cb);
  }

  onOrdenLineasConfirmadas(cb: (data: OrdenLineasConfirmadasPayload) => void): () => void {
    this._socket?.on('orden:lineas_confirmadas', cb);
    return () => this._socket?.off('orden:lineas_confirmadas', cb);
  }

  onOrdenLineaSincronizada(cb: (data: OrdenLineaSincronizadaPayload) => void): () => void {
    this._socket?.on('orden:linea_sincronizada', cb);
    return () => this._socket?.off('orden:linea_sincronizada', cb);
  }

  onOrdenSplitActualizado(cb: (data: OrdenSplitActualizadoPayload) => void): () => void {
    this._socket?.on('orden:split_actualizado', cb);
    return () => this._socket?.off('orden:split_actualizado', cb);
  }
}

// ─── Singleton compartido por todos los módulos POS ──────────────────────────

export const posSocket = new PosSocketService();
