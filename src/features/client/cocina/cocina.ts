import { checkRoleAccess } from '@/global/guards_auth';
import { getSucursalId } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { KdsModule } from '../kds/KdsModule';
import { resolveDestinoId } from '../kds/kds.service';

const _sucursalId = getSucursalId();
if (!_sucursalId) location.replace(route('/lobby'));

if (_sucursalId && checkRoleAccess(['cocinero'])) {
  resolveDestinoId(_sucursalId, 'cocina').then(destinoId => {
    if (!destinoId) {
      document.body.innerHTML = '<div style="padding:2rem;color:red">No hay destino de impresión "cocina" configurado para esta sucursal.</div>';
      return;
    }
    const kds = new KdsModule({
      titulo:         'KDS — Cocina',
      rol:            'cocina',
      accentColor:    '#d63050',
      accentRgb:      '214,48,80',
      timerWarnMins:  8,
      timerLateMins:  15,
      filtroDefault:  'todas',
      destinoId,
      sucursalId:     _sucursalId,
      emptyIcon:      '✓',
      emptyText:      'Sin comandas activas',
      pollIntervalMs: 8000,
    });
    kds.mount();
  });
}
