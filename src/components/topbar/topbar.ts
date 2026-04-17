// ===== TOPBAR COMPONENT =====

import './topbar.css';
import { Notifications } from '@/components/notifications/notifications';
import type { Notification } from '@/components/notifications/notifications';

export function initTopbar(initialNotifications: Notification[] = []): void {
  const bodySide = document.getElementById('bodySide');
  if (!bodySide) {
    console.error('No se encontró #bodySide para montar el topbar');
    return;
  }

  // Construir topbar
  const topbar = document.createElement('header');
  topbar.className = 'topbar';

  // Logo centrado
  const logoSection = document.createElement('div');
  logoSection.className = 'topbar_logo';
  logoSection.innerHTML = `<img src="/logo_combinados.svg" alt="Serval" />`;

  // Sección derecha — notificaciones
  const actionsSection = document.createElement('section');
  actionsSection.className = 'topbar_actions';

  topbar.appendChild(logoSection);
  topbar.appendChild(actionsSection);

  // Insertar topbar al inicio de bodySide (antes de #app)
  bodySide.insertBefore(topbar, bodySide.firstChild);

  // Montar notificaciones dentro de actionsSection
  Notifications(actionsSection, initialNotifications);
}
