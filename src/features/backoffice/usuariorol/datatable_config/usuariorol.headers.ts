import type { GridieHeaderConfig } from '@/lib/gridie';

export const usuarioRolHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Usuario Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Rol Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
