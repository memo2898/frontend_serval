import type { GridieHeaderConfig } from '@/lib/gridie';

export const stockHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Articulo Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Sucursal Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Cantidad Actual',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Cantidad Minima',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
