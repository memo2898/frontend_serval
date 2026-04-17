import { checkRoleAccess } from '@/global/guards_auth';
import { getSucursalId } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { KdsModule } from '../kds/KdsModule';

const _sucursalId = getSucursalId();
if (!_sucursalId) location.replace(route('/lobby'));

if (_sucursalId && checkRoleAccess(['bartender'])) {
  const kds = new KdsModule({
    titulo:         'KDS — Barra',
    accentColor:    '#1a52cc',
    accentRgb:      '26,82,204',
    timerWarnMins:  5,
    timerLateMins:  10,
    filtroDefault:  'barra',
    destinoId:      2,
    sucursalId:     getSucursalId(),
    emptyIcon:      '🍹',
    emptyText:      'Sin comandas para la barra',
    pollIntervalMs: 5000,
  });

  kds.mount();
}
