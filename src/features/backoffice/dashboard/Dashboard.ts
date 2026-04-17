import './dashboard.css';
import { getUser, getSelectedRole } from '@/global/session.service';
import { route } from '@/global/saveRoutes';

interface QuickAccessItem {
  icon: string;
  label: string;
  href: string;
  color: string;
}

const QUICK_ACCESS: QuickAccessItem[] = [
  { icon: 'fa-utensils',            label: 'Artículos',          href: '/articulos',           color: '#d63050' },
  { icon: 'fa-chair',               label: 'Mesas',              href: '/mesas',               color: '#7c3aed' },
  { icon: 'fa-users',               label: 'Clientes',           href: '/clientes',            color: '#0891b2' },
  { icon: 'fa-cash-register',       label: 'Turnos de Caja',     href: '/turnoscaja',          color: '#059669' },
  { icon: 'fa-receipt',             label: 'Órdenes',            href: '/ordenes',             color: '#d97706' },
  { icon: 'fa-file-invoice-dollar', label: 'Facturas',           href: '/facturas',            color: '#dc2626' },
  { icon: 'fa-boxes',               label: 'Stock',              href: '/stock',               color: '#4f46e5' },
  { icon: 'fa-tags',                label: 'Tarifas',            href: '/tarifas',             color: '#0d9488' },
  { icon: 'fa-shield-alt',          label: 'Usuarios',           href: '/usuarios',            color: '#6b7280' },
  { icon: 'fa-cog',                 label: 'Configuración',      href: '/configuracionsucursal', color: '#92400e' },
];

export function Dashboard(container: HTMLElement): void {
  const user        = getUser();
  const role        = getSelectedRole();
  const hasMultiRol = (user?.roles?.length ?? 0) > 1;
  const nombreCompleto = user ? `${user.nombre} ${user.apellido}` : 'Usuario';
  const rolNombre      = role?.nombre ?? 'Sin rol';

  container.innerHTML = `
    <div class="dash-wrapper">

      <!-- Bienvenida -->
      <div class="dash-welcome">
        <div class="dash-welcome-text">
          <h1>Bienvenido, <span>${nombreCompleto}</span></h1>
          <p class="dash-welcome-sub">
            <i class="fas fa-id-badge"></i>
            ${rolNombre}
          </p>
        </div>
        ${hasMultiRol ? `
          <a href="${route('/lobby')}" class="dash-switch-btn" title="Cambiar de rol">
            <i class="fas fa-exchange-alt"></i>
            <span>Cambiar Rol</span>
          </a>
        ` : ''}
      </div>

      <!-- Accesos rápidos -->
      <section class="dash-section">
        <h2 class="dash-section-title">
          <i class="fas fa-th-large"></i>
          Acceso Rápido
        </h2>
        <div class="dash-grid">
          ${QUICK_ACCESS.map(item => `
            <a href="${route(item.href)}" class="dash-card">
              <div class="dash-card-icon" style="background:${item.color}1a; color:${item.color}">
                <i class="fas ${item.icon}"></i>
              </div>
              <span class="dash-card-label">${item.label}</span>
            </a>
          `).join('')}
        </div>
      </section>

    </div>
  `;
}
