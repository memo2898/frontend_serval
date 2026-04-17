import type { GridieHeaderConfig } from '@/lib/gridie';

export const sucursalImpuestosHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Sucursal Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Impuesto Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Obligatorio',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Orden Aplicacion',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
