import type { GridieHeaderConfig } from '@/lib/gridie';

export const alergenosHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
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
    label: 'Icono',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
