import type { GridieHeaderConfig } from '@/lib/gridie';

export const monedasHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Codigo',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Nombre',
    type: 'string',
    sortable: true,
    filters: {
      filterRow: { visible: true },
    },
  },
  {
    label: 'Simbolo',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Decimales',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Estado',
    type: 'string',
    sortable: true,
    width: '100px',
    filters: {
      headerFilter: { visible: true, showCount: true },
    },
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
