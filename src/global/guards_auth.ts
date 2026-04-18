import { isLoggedIn, clearSession, mustChangePassword, getContext, hasPermission, isSuperAdmin, getSelectedRole } from './session.service';
export { isSuperAdmin };
import { route } from './saveRoutes';

const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  camarero:  '/pos/mesas',
  cocinero:  '/pos/cocina',
  cajero:    '/pos/caja',
  bartender: '/pos/barra',
  encargado: '/tipodocumentos',
};

export function isBackofficeRole(): boolean {
  const role = getSelectedRole();
  if (!role) return false;
  const roleName = role.nombre?.toLowerCase() ?? '';
  return ['administrador', 'encargado'].includes(roleName);
}

export function getDefaultRoute(): string {
  const role = getSelectedRole();
  if (!role) return route('/login');
  if (isSuperAdmin()) return route('/dashboard');
  const roleName = role.nombre?.toLowerCase() ?? '';
  return route(ROLE_DEFAULT_ROUTES[roleName] ?? '/login');
}

/** Retorna true si el acceso está permitido, false si se redirigió. */
export function checkRoleAccess(allowedRoles: string[]): boolean {
  if (!isLoggedIn()) {
    clearSession();
    location.replace(route('/login'));
    return false;
  }
  if (isSuperAdmin()) return true;
  const role = getSelectedRole();
  const userRoleName = role?.nombre?.toLowerCase() ?? '';
  const hasAccess = allowedRoles.some(r => r.toLowerCase() === userRoleName);
  if (!hasAccess) {
    location.replace(getDefaultRoute());
    return false;
  }
  return true;
}

export function checkIfLogin(): boolean {
  if (!isLoggedIn()) {
    clearSession();
    location.replace(route('/login'));
    return false;
  }
  return true;
}

export function checkHasContext(): void {
  if (!getContext()) {
    location.href = route('/lobby');
  }
}

export function checkHasPermission(permiso: string): void {
  if (!hasPermission(permiso)) {
    location.href = route('/dashboard');
  }
}

export function checkIsSuperAdmin(): void {
  if (!isSuperAdmin()) {
    location.href = route('/dashboard');
  }
}

export function checkMustChangePassword(): void {
  if (!mustChangePassword()) return;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — no declaration file for this JS module
  import('@/components/passwordModal/passwordModal').then((m: any) => {
    m.openForcedPasswordModal();
  });
}
