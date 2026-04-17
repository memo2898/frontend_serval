import { clearSession } from './session.service';
import { route } from './saveRoutes';

export function doLogout(): void {
  clearSession();
  location.href = route('/login');
}
