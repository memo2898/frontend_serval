import { getUser, saveSelectedRole, clearSession, isLoggedIn } from '@/global/session.service';
import { getDefaultRoute, isSuperAdmin } from '@/global/guards_auth';
import { navigateTo, route } from '@/global/saveRoutes';
import type { LoginUserRole } from '@/features/backoffice/auth/auth.types';

// Mapa de iconos por nombre de rol
const ROLE_ICONS: Record<string, string> = {
  administrador: 'fa-user-shield',
  encargado:     'fa-user-tie',
  cajero:        'fa-cash-register',
  camarero:      'fa-concierge-bell',
  cocinero:      'fa-utensils',
  bartender:     'fa-wine-glass-alt',
};

function getIconForRole(nombre: string): string {
  return ROLE_ICONS[nombre.toLowerCase()] ?? 'fa-user-circle';
}

function init(): void {
  // Si no está logueado, manda al login
  if (!isLoggedIn()) {
    clearSession();
    location.replace(route('/login'));
    return;
  }

  const user = getUser();
  if (!user) {
    location.replace(route('/login'));
    return;
  }

  // Mostrar nombre del usuario
  const nameEl = document.getElementById('lobbyUserName');
  if (nameEl) {
    nameEl.textContent = `${user.nombre} ${user.apellido}`;
  }

  const roles = user.roles ?? [];

  // Si solo tiene 1 rol, seleccionarlo directo y redirigir
  if (roles.length === 1) {
    saveSelectedRole(roles[0]);
    navigateTo(getDefaultRoute());
    return;
  }

  // Si no tiene roles, volver al login
  if (roles.length === 0) {
    clearSession();
    location.replace(route('/login'));
    return;
  }

  renderRoles(roles);
}

function renderRoles(roles: LoginUserRole[]): void {
  const grid = document.getElementById('rolesGrid');
  if (!grid) return;

  grid.innerHTML = '';

  for (const rol of roles) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.dataset.roleId = String(rol.id);

    card.innerHTML = `
      <div class="role-icon">
        <i class="fas ${getIconForRole(rol.nombre)}"></i>
      </div>
      <div class="role-info">
        <span class="role-name">${rol.nombre}</span>
        ${rol.descripcion ? `<span class="role-desc">${rol.descripcion}</span>` : ''}
      </div>
    `;

    card.addEventListener('click', () => selectRole(rol));
    grid.appendChild(card);
  }
}

function selectRole(rol: LoginUserRole): void {
  saveSelectedRole(rol);
  navigateTo(getDefaultRoute());
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  clearSession();
  location.replace(route('/login'));
});

init();
