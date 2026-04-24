import { checkRoleAccess } from '@/global/guards_auth';
import { getSucursalId } from '@/global/session.service';
import { route } from '@/global/saveRoutes';
import { KdsModule } from '../kds/KdsModule';
import { resolveDestinoId } from '../kds/kds.service';
import { initAdminBubble } from '@/components/admin-bubble/admin-bubble';

const _sucursalId = getSucursalId();
if (!_sucursalId) location.replace(route('/lobby'));
initAdminBubble();

if (_sucursalId && checkRoleAccess(['bartender'])) {
  resolveDestinoId(_sucursalId, 'barra').then(destinoId => {
    if (!destinoId) {
      document.body.innerHTML = '<div style="padding:2rem;color:red">No hay destino de impresión "barra" configurado para esta sucursal.</div>';
      return;
    }
    const kds = new KdsModule({
      titulo:         'KDS — Barra',
      rol:            'barra',
      accentColor:    '#1a52cc',
      accentRgb:      '26,82,204',
      timerWarnMins:  5,
      timerLateMins:  10,
      filtroDefault:  'todas',
      destinoId,
      sucursalId:     _sucursalId,
      emptyIcon:      '🍹',
      emptyText:      'Sin comandas para la barra',
      pollIntervalMs: 5000,
    });
    kds.mount();
  });
}
