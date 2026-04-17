// ===== NOTIFICATIONS SERVICE (WebSocket) =====

import { io, type Socket } from 'socket.io-client';
import { SERVER_ROUTE } from '@/config';
import { getUser, isSuperAdmin } from '@/global/session.service';
import { http } from '@/http';
import { navigateTo } from '@/global/saveRoutes';
import type { NotificationsComponent, Notification } from '@/components/notifications/notifications';

// ── Tipos del socket ──────────────────────────────────────

type TipoNotificacion =
  | 'solicitud_recibida'
  | 'solicitud_cancelada_ciudadano'
  | 'reporte_mantenimiento_nuevo'
  | 'reporte_mantenimiento_critico'
  | 'reporte_mantenimiento_actualizado';

interface SocketNotificacion {
  id_notificacion: number;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  tabla_origen: string;
  entidad_id: number;
  id_parque: number;
  timestamp: string;
}

interface NotificacionRaw {
  id?: number;
  tipo?: string;
  titulo?: string;
  mensaje?: string;
  tabla_origen?: string;
  entidad_id?: number;
  leida?: boolean;
  created_at?: string;
}

interface UsuarioParqueRaw {
  id?: number;
  id_parque?: number;
  estado?: string;
}

// ── Mapa tipo → presentación ──────────────────────────────

const TIPO_MAP: Record<TipoNotificacion, { type: Notification['type'] }> = {
  solicitud_recibida:                  { type: 'info'    },
  solicitud_cancelada_ciudadano:       { type: 'warning' },
  reporte_mantenimiento_nuevo:         { type: 'info'    },
  reporte_mantenimiento_critico:       { type: 'error'   },
  reporte_mantenimiento_actualizado:   { type: 'info'    },
};

// ── Rutas por tabla_origen ────────────────────────────────

const TABLA_RUTAS: Record<string, string> = {
  solicitudes_reservaciones: '/solicitudesreservaciones',
  reportes_mantenimiento:    '/reportesmantenimiento',
};

function navegarARecurso(tabla_origen: string, entidad_id: number): void {
  const base = TABLA_RUTAS[tabla_origen];
  navigateTo(base ? `${base}?id=${entidad_id}` : '/');
}

// ── Servicio ──────────────────────────────────────────────

class NotificationsService {
  private _socket: Socket | null = null;
  private _component: NotificationsComponent | null = null;
  private _parques: number[] = [];

  async init(component: NotificationsComponent): Promise<void> {
    this._component = component;

    // Registrar callbacks del componente
    component.setCallbacks({
      onOpen:               () => this._fetchNotifications(),
      onMarkAsRead:         (id) => { void this._markAsRead(id); },
      onMarkAllAsRead:      () => { void this._markAllAsRead(); },
      onClickNotification:  (notif) => {
        if (notif.tabla_origen != null && notif.entidad_id != null) {
          navegarARecurso(notif.tabla_origen, notif.entidad_id);
        }
      },
    });

    const user = getUser();
    if (!user) return;

    // Badge inicial desde REST
    void this._fetchUnreadCount().then(count => component.setBadgeCount(count));

    const superAdmin = isSuperAdmin();

    // Superadmin: no necesita obtener parques, usa sala global
    if (!superAdmin) {
      const parques = await this._fetchParques(user.id);
      if (parques.length === 0) return;
      this._parques = parques;
    }

    this._socket = io(`${SERVER_ROUTE}/notificaciones`, {
      transports: ['websocket'],
      autoConnect: false,
    });

    this._socket.on('connect', () => {
      console.log('[Notificaciones] Socket conectado. ID:', this._socket!.id);
      if (superAdmin) {
        console.log('[Notificaciones] Superadmin: uniéndose a sala global');
        this._socket!.emit('unirse_superadmin');
      } else {
        this._parques.forEach((id_parque: number) => {
          this._socket!.emit('unirse_parque', { id_parque });
        });
      }
    });

    this._socket.on('notificacion', (data: SocketNotificacion) => {
      console.log('[Notificaciones] Notificación recibida:', data);
      this._push(data);
    });

    this._socket.on('connect_error', (err) => {
      console.error('[Notificaciones] Error de conexión:', err.message, err);
    });

    this._socket.on('disconnect', (reason) => {
      console.warn('[Notificaciones] Desconectado:', reason);
    });

    this._socket.connect();
  }

  private async _fetchUnreadCount(): Promise<number> {
    try {
      const res = await http.get<{ total: number }>(`${SERVER_ROUTE}/api/notificaciones/conteo-no-leidas`);
      return res.total ?? 0;
    } catch {
      return 0;
    }
  }

  private async _fetchNotifications(): Promise<Notification[] | null> {
    try {
      const res = await http.get<NotificacionRaw[] | { data: NotificacionRaw[] } | { statusCode: number }>(
        `${SERVER_ROUTE}/api/notificaciones/recientes`,
      );
      // Endpoint aún no implementado u otro error HTTP devuelto como JSON
      if (res && typeof res === 'object' && 'statusCode' in res) {
        return null;
      }
      const items = Array.isArray(res)
        ? res
        : (res as { data: NotificacionRaw[] }).data ?? [];
      return items.map(n => this._rawToNotification(n));
    } catch (err) {
      console.error('[Notificaciones] Error al cargar notificaciones:', err);
      return null;
    }
  }

  private _rawToNotification(n: NotificacionRaw): Notification {
    const time = (() => {
      try {
        return new Date(n.created_at ?? '').toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch { return ''; }
    })();

    const tipo = n.tipo as TipoNotificacion;
    const typeMap = TIPO_MAP[tipo] ?? { type: 'info' as const };

    return {
      id:              String(n.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      id_notificacion: n.id,
      title:           n.titulo ?? 'Notificación',
      text:            n.mensaje ?? '',
      type:            typeMap.type,
      time,
      read:            n.leida ?? false,
      tabla_origen:    n.tabla_origen,
      entidad_id:      n.entidad_id,
    };
  }

  private async _markAsRead(id_notificacion: number): Promise<void> {
    try {
      await http.patch(`${SERVER_ROUTE}/api/notificaciones/${id_notificacion}/leer`, {});
    } catch (err) {
      console.error('[Notificaciones] Error al marcar como leída:', err);
    }
  }

  private async _markAllAsRead(): Promise<void> {
    try {
      await http.patch(`${SERVER_ROUTE}/api/notificaciones/leer-todas`, {});
    } catch (err) {
      console.error('[Notificaciones] Error al marcar todas como leídas:', err);
    }
  }

  private async _fetchParques(userId: number): Promise<number[]> {
    try {
      console.log('[Notificaciones] Obteniendo parques del usuario:', userId);
      const res = await http.get<{ data: UsuarioParqueRaw[] } | UsuarioParqueRaw[]>(
        `${SERVER_ROUTE}/api/usuarios-parques?id_usuario=${userId}&estado=ACTIVO`,
      );
      console.log('[Notificaciones] Respuesta usuarios-parques:', res);
      const items = Array.isArray(res) ? res : (res as { data: UsuarioParqueRaw[] }).data ?? [];
      return items
        .filter(r => r.id_parque != null)
        .map(r => r.id_parque!);
    } catch (err) {
      console.error('[Notificaciones] Error al obtener parques:', err);
      return [];
    }
  }


  private _push(data: SocketNotificacion): void {
    if (!this._component) return;

    const typeMap = TIPO_MAP[data.tipo] ?? { type: 'info' as const };

    const time = (() => {
      try {
        return new Date(data.timestamp).toLocaleTimeString('es-DO', {
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return '';
      }
    })();

    const notification: Notification = {
      id:              `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      id_notificacion: data.id_notificacion,
      title:           data.titulo,
      text:            data.mensaje,
      type:            typeMap.type,
      time,
      read:            false,
      tabla_origen:    data.tabla_origen,
      entidad_id:      data.entidad_id,
    };

    this._component.addNotification(notification);
  }

  destroy(): void {
    this._socket?.disconnect();
    this._socket = null;
    this._component = null;
  }
}

export const notificationsService = new NotificationsService();
