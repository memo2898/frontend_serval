import type { GridieHeaderConfig } from '@/lib/gridie';

export const articuloAlergenosHeaders: GridieHeaderConfig[] = [
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
    label: 'Alergeno Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
