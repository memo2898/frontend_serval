import type { GridieHeaderConfig } from '@/lib/gridie';

export const articuloImpuestosHeaders: GridieHeaderConfig[] = [
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
    label: 'Impuesto Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
