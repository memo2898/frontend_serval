import { checkRoleAccess } from '@/global/guards_auth';
import { getSucursalId } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { KdsModule } from '../kds/KdsModule';

const _sucursalId = getSucursalId();
if (!_sucursalId) location.replace(route('/lobby'));

if (_sucursalId && checkRoleAccess(['cocinero'])) {
  const kds = new KdsModule({
    titulo:         'KDS — Cocina',
    accentColor:    '#d63050',
    accentRgb:      '214,48,80',
    timerWarnMins:  8,
    timerLateMins:  15,
    filtroDefault:  'todas',
    destinoId:      1,
    sucursalId:     getSucursalId(),
    emptyIcon:      '✓',
    emptyText:      'Sin comandas activas',
    pollIntervalMs: 8000,
  });

  kds.mount();
}
