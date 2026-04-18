import { getUser, saveSelectedRole, saveContext, clearSession, isLoggedIn } from '@/global/session.service';
import { getDefaultRoute } from '@/global/guards_auth';
import { navigateTo, route } from '@/global/saveRoutes';
import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { LoginUserRole } from '@/features/backoffice/auth/auth.types';

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface SucursalOpcion {
  id: number;
  nombre: string;
}

// ─── Iconos de rol ────────────────────────────────────────────────────────────

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

// ─── Estado ───────────────────────────────────────────────────────────────────

let _rolSeleccionado: LoginUserRole | null = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
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

  const nameEl = document.getElementById('lobbyUserName');
  if (nameEl) nameEl.textContent = `${user.nombre} ${user.apellido ?? ''}`.trim();

  const roles = user.roles ?? [];

  if (roles.length === 0) {
    clearSession();
    location.replace(route('/login'));
    return;
  }

  // Un solo rol → seleccionar directo y continuar flujo de sucursal
  if (roles.length === 1) {
    continueWithRole(roles[0]);
    return;
  }

  renderRoles(roles);
}

// ─── Renderizado de roles ─────────────────────────────────────────────────────

function renderRoles(roles: LoginUserRole[]): void {
  const grid = document.getElementById('rolesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const rol of roles) {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.innerHTML = `
      <div class="role-icon">
        <i class="fas ${getIconForRole(rol.nombre)}"></i>
      </div>
      <div class="role-info">
        <span class="role-name">${rol.nombre}</span>
        ${rol.descripcion ? `<span class="role-desc">${rol.descripcion}</span>` : ''}
      </div>
    `;
    card.addEventListener('click', () => continueWithRole(rol));
    grid.appendChild(card);
  }
}

// ─── Flujo de selección de sucursal ──────────────────────────────────────────

function continueWithRole(rol: LoginUserRole): void {
  _rolSeleccionado = rol;
  saveSelectedRole(rol);

  const esAdmin = rol.nombre.toLowerCase() === 'administrador';

  if (esAdmin) {
    // Administrador: preguntar qué sucursal usará
    openSucursalModal();
    return;
  }

  // Otros roles: tomar la sucursal del registro del usuario
  const user = getUser();
  const sucursalId = user?.sucursal_id ?? null;

  if (!sucursalId) {
    showErrorSinSucursal();
    return;
  }

  // Tenemos la sucursal → guardar contexto y navegar
  saveContext({
    sucursal_id:     sucursalId,
    nombre_sucursal: '', // el usuario no tiene el nombre en su registro
    id_rol:          rol.id,
    nombre_rol:      rol.nombre,
  });
  navigateTo(getDefaultRoute());
}

// ─── Modal de sucursal (solo admin) ──────────────────────────────────────────

function openSucursalModal(): void {
  const modal   = document.getElementById('modalSucursal')!;
  const loading = document.getElementById('sucursalesLoading')!;
  const select  = document.getElementById('sucursalSelect') as HTMLSelectElement;
  const errEl   = document.getElementById('sucursalesError')!;
  const btn     = document.getElementById('btnConfirmarSucursal') as HTMLButtonElement;

  modal.style.display = 'flex';
  loading.style.display = 'block';
  select.style.display  = 'none';
  errEl.style.display   = 'none';
  btn.disabled          = true;

  http.get<Array<SucursalOpcion & { estado?: string }>>(`${SERVER_ROUTE}/api/sucursales`)
    .then(raw => {
      loading.style.display = 'none';

      const sucursales = raw.filter(s => s.estado !== 'eliminado');

      if (!sucursales.length) {
        errEl.textContent   = 'No hay sucursales activas registradas.';
        errEl.style.display = 'block';
        return;
      }

      // Limpiar opciones anteriores (excepto el placeholder)
      select.options.length = 1;
      sucursales.forEach(s => {
        const opt = document.createElement('option');
        opt.value       = String(s.id);
        opt.textContent = s.nombre;
        select.appendChild(opt);
      });

      select.style.display = 'block';

      // Si solo hay una sucursal, preseleccionarla
      if (sucursales.length === 1) {
        select.value  = String(sucursales[0].id);
        btn.disabled  = false;
      }
    })
    .catch(() => {
      loading.style.display = 'none';
      errEl.style.display   = 'block';
    });
}

function confirmSucursal(): void {
  const select = document.getElementById('sucursalSelect') as HTMLSelectElement;
  const id     = Number(select.value);
  const nombre = select.options[select.selectedIndex]?.text ?? '';

  if (!id || !_rolSeleccionado) return;

  saveContext({
    sucursal_id:     id,
    nombre_sucursal: nombre,
    id_rol:          _rolSeleccionado.id,
    nombre_rol:      _rolSeleccionado.nombre,
  });

  document.getElementById('modalSucursal')!.style.display = 'none';
  navigateTo(getDefaultRoute());
}

// ─── Error sin sucursal asignada ──────────────────────────────────────────────

function showErrorSinSucursal(): void {
  const banner = document.getElementById('errorSinSucursal')!;
  banner.style.display = 'flex';
  // Auto-ocultar después de 6 s
  setTimeout(() => { banner.style.display = 'none'; }, 6000);
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

document.getElementById('sucursalSelect')?.addEventListener('change', (e) => {
  const btn = document.getElementById('btnConfirmarSucursal') as HTMLButtonElement;
  btn.disabled = !(e.target as HTMLSelectElement).value;
});

document.getElementById('btnConfirmarSucursal')?.addEventListener('click', confirmSucursal);

const _doLogout = () => { clearSession(); location.replace(route('/login')); };
document.getElementById('logoutBtn')?.addEventListener('click', _doLogout);
document.getElementById('btnLogoutModal')?.addEventListener('click', _doLogout);

init();
