import type { GridieHeaderConfig } from '@/lib/gridie';

export const permisosHeaders: GridieHeaderConfig[] = [
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
    label: 'Descripcion',
    type: 'string',
    sortable: true,
    filters: {
      filterRow: { visible: true },
    },
  },
  // {
  //   label: 'Acciones',
  //   width: '240px',
  // },
];
