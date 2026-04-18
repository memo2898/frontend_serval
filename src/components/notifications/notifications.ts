// ===== NOTIFICATIONS COMPONENT =====

import './notifications.css';

export interface Notification {
  id: string;
  title: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  time: string;
  read: boolean;
  // Extended fields used by the notifications service
  id_notificacion?: number;
  tabla_origen?: string;
  entidad_id?: number;
}

export interface NotificationCallbacks {
  onOpen?: () => void;
  onMarkAsRead?: (id: number) => void;
  onMarkAllAsRead?: () => void;
  onClickNotification?: (notif: Notification) => void;
}

const TYPE_ICONS: Record<Notification['type'], string> = {
  info:    'fas fa-info',
  success: 'fas fa-check',
  warning: 'fas fa-exclamation',
  error:   'fas fa-times',
};

export class NotificationsComponent {
  private _notifications: Notification[] = [];
  private _callbacks: NotificationCallbacks = {};
  private _wrapper!: HTMLElement;
  private _btn!: HTMLButtonElement;
  private _badge!: HTMLElement;
  private _dropdown!: HTMLElement;
  private _list!: HTMLElement;
  private _isOpen = false;

  constructor(initialNotifications: Notification[] = []) {
    this._notifications = initialNotifications;
  }

  mount(container: HTMLElement): HTMLElement {
    this._wrapper = document.createElement('div');
    this._wrapper.className = 'notif_wrapper';

    // Botón campana
    this._btn = document.createElement('button');
    this._btn.className = 'notif_btn';
    this._btn.setAttribute('aria-label', 'Notificaciones');
    this._btn.innerHTML = `
      <i class="fas fa-bell"></i>
      <span class="notif_badge hidden" id="notif_badge">0</span>
    `;

    // Dropdown
    this._dropdown = document.createElement('div');
    this._dropdown.className = 'notif_dropdown';
    this._dropdown.innerHTML = `
      <div class="notif_header">
        <h4>Notificaciones</h4>
        <button class="notif_mark_all">Marcar todas como leídas</button>
      </div>
      <div class="notif_list"></div>
      <div class="notif_footer">
        <a href="#">Ver todas las notificaciones</a>
      </div>
    `;

    this._badge = this._btn.querySelector('.notif_badge') as HTMLElement;
    this._list  = this._dropdown.querySelector('.notif_list') as HTMLElement;

    this._wrapper.appendChild(this._btn);
    this._wrapper.appendChild(this._dropdown);
    container.appendChild(this._wrapper);

    this._renderList();
    this._updateBadge();
    this._setupListeners();

    return this._wrapper;
  }

  private _renderList(): void {
    if (this._notifications.length === 0) {
      this._list.innerHTML = `
        <div class="notif_empty">
          <i class="fas fa-bell-slash"></i>
          No tienes notificaciones
        </div>
      `;
      return;
    }

    this._list.innerHTML = this._notifications.map(n => `
      <div class="notif_item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif_icon ${n.type}">
          <i class="${TYPE_ICONS[n.type]}"></i>
        </div>
        <div class="notif_content">
          <p class="notif_title">${n.title}</p>
          <p class="notif_text">${n.text}</p>
          <span class="notif_time">${n.time}</span>
        </div>
        ${!n.read ? '<div class="notif_dot"></div>' : ''}
      </div>
    `).join('');

    // Marcar como leída al hacer click
    this._list.querySelectorAll('.notif_item').forEach(item => {
      item.addEventListener('click', () => {
        const id = (item as HTMLElement).dataset['id']!;
        this.markAsRead(id);
      });
    });
  }

  private _updateBadge(): void {
    const unread = this._notifications.filter(n => !n.read).length;
    if (unread > 0) {
      this._badge.textContent = unread > 99 ? '99+' : String(unread);
      this._badge.classList.remove('hidden');
    } else {
      this._badge.classList.add('hidden');
    }
  }

  private _setupListeners(): void {
    // Toggle dropdown
    this._btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._isOpen ? this._close() : this._open();
    });

    // Cerrar al click fuera
    document.addEventListener('click', (e) => {
      if (!this._wrapper.contains(e.target as Node)) {
        this._close();
      }
    });

    // Marcar todas como leídas
    this._dropdown.querySelector('.notif_mark_all')?.addEventListener('click', () => {
      this.markAllAsRead();
      this._callbacks.onMarkAllAsRead?.();
    });
  }

  private _open(): void {
    this._isOpen = true;
    this._dropdown.classList.add('open');
    this._callbacks.onOpen?.();
  }

  private _close(): void {
    this._isOpen = false;
    this._dropdown.classList.remove('open');
  }

  markAsRead(id: string): void {
    const notif = this._notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this._renderList();
      this._updateBadge();
      if (notif.id_notificacion != null) {
        this._callbacks.onMarkAsRead?.(notif.id_notificacion);
      }
      this._callbacks.onClickNotification?.(notif);
    }
  }

  markAllAsRead(): void {
    this._notifications.forEach(n => { n.read = true; });
    this._renderList();
    this._updateBadge();
  }

  setNotifications(notifications: Notification[]): void {
    this._notifications = notifications;
    this._renderList();
    this._updateBadge();
  }

  addNotification(notification: Notification): void {
    this._notifications.unshift(notification);
    this._renderList();
    this._updateBadge();
  }

  setCallbacks(callbacks: NotificationCallbacks): void {
    this._callbacks = callbacks;
  }

  setBadgeCount(count: number): void {
    if (!this._badge) return;
    if (count > 0) {
      this._badge.textContent = count > 99 ? '99+' : String(count);
      this._badge.classList.remove('hidden');
    } else {
      this._badge.classList.add('hidden');
    }
  }
}

export function Notifications(
  container: HTMLElement,
  initialNotifications: Notification[] = [],
): NotificationsComponent {
  const component = new NotificationsComponent(initialNotifications);
  component.mount(container);
  return component;
}
