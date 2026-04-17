import type { GridieHeaderConfig } from '@/lib/gridie';

export const kdsOrdenesHeaders: GridieHeaderConfig[] = [
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
    label: 'Destino Id',
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
    label: 'Tiempo Recibido',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Tiempo Preparado',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
