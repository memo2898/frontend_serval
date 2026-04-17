import type { GridieHeaderConfig } from '@/lib/gridie';

export const rolPermisoHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Rol Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Permiso Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
