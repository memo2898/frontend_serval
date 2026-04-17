import type { GridieHeaderConfig } from '@/lib/gridie';

export const comboArticulosHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Combo Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Articulo Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Cantidad',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Precio Especial',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
