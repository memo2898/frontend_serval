import type { GridieHeaderConfig } from '@/lib/gridie';

export const ordenLineaModificadoresHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Orden Linea Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Modificador Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Precio Extra',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
