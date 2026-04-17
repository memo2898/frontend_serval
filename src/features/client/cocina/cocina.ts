import { checkRoleAccess } from '@/global/guards_auth';
import { KdsModule } from '../kds/KdsModule';
import type { Comanda } from '../kds/kds.types';

if (checkRoleAccess(['cocinero'])) {
  const kds = new KdsModule({
    titulo:         'KDS — Cocina',
    accentColor:    '#d63050',
    accentRgb:      '214,48,80',
    timerWarnMins:  8,
    timerLateMins:  15,
    filtroDefault:  'todas',
    destinoId:      1,
    emptyIcon:      '✓',
    emptyText:      'Sin comandas activas',
    pollIntervalMs: 8000,
  });

  kds.mount();

  // ─── Demo data (activo mientras no hay backend) ───────────────────────────────
  const now = Date.now();
  const DEMO: Comanda[] = [
    {
      id: 'C-0041', numero: '#0041', mesa: 'M2', tipo: 'mesa',
      estado: 'pendiente', abierta: now - 3 * 60000,
      lineas: [
        { id: 1,  nombre: 'Churrasco',  qty: 1, mods: 'Término: al punto · Acompañamiento: papas fritas', nota: 'Sin sal', done: false },
        { id: 2,  nombre: 'Lomo Fino',  qty: 1, mods: 'Término: poco hecho', nota: '', done: false },
        { id: 3,  nombre: 'Coca Cola',  qty: 2, mods: '', nota: '', done: false },
      ],
    },
    {
      id: 'C-0042', numero: '#0042', mesa: 'T2', tipo: 'mesa',
      estado: 'en_preparacion', abierta: now - 11 * 60000,
      lineas: [
        { id: 4, nombre: 'Costillas BBQ',  qty: 2, mods: 'Extras: chimichurri, salsa BBQ', nota: '', done: true },
        { id: 5, nombre: 'Ensalada Verde', qty: 1, mods: '', nota: 'Sin cebolla', done: false },
        { id: 6, nombre: 'Agua Mineral',   qty: 3, mods: '', nota: '', done: true },
      ],
    },
    {
      id: 'C-0043', numero: '#0043', mesa: '—', tipo: 'take_away',
      estado: 'pendiente', abierta: now - 6 * 60000,
      lineas: [
        { id: 7, nombre: 'Pollo a la Brasa', qty: 1, mods: '', nota: '', done: false },
        { id: 8, nombre: 'Jugo Natural',     qty: 1, mods: 'Sabor: maracuyá', nota: '', done: false },
      ],
    },
    {
      id: 'C-0044', numero: '#0044', mesa: '—', tipo: 'delivery',
      estado: 'pendiente', abierta: now - 2 * 60000,
      lineas: [
        { id: 11, nombre: 'Chef Especial', qty: 1, mods: 'Término: al punto', nota: 'Alergia: nueces', done: false },
        { id: 12, nombre: 'Brownie',       qty: 2, mods: '', nota: '', done: false },
      ],
    },
    {
      id: 'C-0040', numero: '#0040', mesa: 'M4', tipo: 'mesa',
      estado: 'listo', abierta: now - 22 * 60000,
      lineas: [
        { id: 9,  nombre: 'Filete Miñón', qty: 1, mods: 'Término: bien hecho', nota: '', done: true },
        { id: 10, nombre: 'Vino Tinto',   qty: 1, mods: '', nota: '', done: true },
      ],
    },
  ];
  kds.loadDemoData(DEMO);
}
