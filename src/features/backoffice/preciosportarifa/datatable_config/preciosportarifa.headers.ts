import type { GridieHeaderConfig } from '@/lib/gridie';

export const preciosPorTarifaHeaders: GridieHeaderConfig[] = [
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
    label: 'Tarifa Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Precio',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
