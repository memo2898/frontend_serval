import { checkRoleAccess } from '@/global/guards_auth';
import { KdsModule } from '../kds/KdsModule';
import type { Comanda } from '../kds/kds.types';

if (checkRoleAccess(['bartender'])) {
  const kds = new KdsModule({
    titulo:         'KDS — Barra',
    accentColor:    '#1a52cc',
    accentRgb:      '26,82,204',
    timerWarnMins:  5,
    timerLateMins:  10,
    filtroDefault:  'barra',
    destinoId:      2,
    emptyIcon:      '🍹',
    emptyText:      'Sin comandas para la barra',
    pollIntervalMs: 5000,
  });

  kds.mount();

  // ─── Demo data (activo mientras no hay backend) ───────────────────────────────
  const now = Date.now();
  const DEMO: Comanda[] = [
    {
      id: 'B-0039', numero: '#0039', mesa: 'B2', tipo: 'barra',
      estado: 'en_preparacion', abierta: now - 4 * 60000,
      lineas: [
        { id: 1, nombre: 'Cerveza Local', qty: 3, mods: '', nota: '', done: true },
        { id: 2, nombre: 'Mojito',        qty: 2, mods: '', nota: 'Con poca azúcar', done: false },
        { id: 3, nombre: 'Agua Mineral',  qty: 2, mods: '', nota: '', done: true },
      ],
    },
    {
      id: 'B-0041', numero: '#0041', mesa: 'M2', tipo: 'mesa',
      estado: 'pendiente', abierta: now - 2 * 60000,
      lineas: [
        { id: 4, nombre: 'Coca Cola',   qty: 2, mods: '', nota: '', done: false },
        { id: 5, nombre: 'Jugo Natural',qty: 1, mods: 'Sabor: maracuyá', nota: '', done: false },
        { id: 6, nombre: 'Vino Tinto',  qty: 1, mods: '', nota: '', done: false },
      ],
    },
    {
      id: 'B-0043', numero: '#0043', mesa: '—', tipo: 'take_away',
      estado: 'pendiente', abierta: now - 3 * 60000,
      lineas: [
        { id: 9,  nombre: 'Jugo Natural', qty: 2, mods: 'Sabor: naranja', nota: '', done: false },
        { id: 10, nombre: 'Coca Cola',    qty: 1, mods: '', nota: '', done: false },
      ],
    },
    {
      id: 'B-0038', numero: '#0038', mesa: 'M5', tipo: 'mesa',
      estado: 'listo', abierta: now - 14 * 60000,
      lineas: [
        { id: 11, nombre: 'Vino Tinto',   qty: 2, mods: '', nota: '', done: true },
        { id: 12, nombre: 'Agua Mineral', qty: 1, mods: '', nota: '', done: true },
      ],
    },
  ];
  kds.loadDemoData(DEMO);
}
