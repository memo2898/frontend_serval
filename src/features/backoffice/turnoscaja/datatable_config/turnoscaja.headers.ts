import type { GridieHeaderConfig } from '@/lib/gridie';

export const turnosCajaHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Terminal Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Usuario Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Fecha Apertura',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Fecha Cierre',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Monto Apertura',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Monto Cierre Declarado',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Monto Cierre Real',
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
    label: 'Agregado En',
    type: 'string',
    sortable: true,
    width: '140px',
  },
  {
    label: 'Agregado Por',
    type: 'number',
    sortable: true,
    width: '120px',
  },
  {
    label: 'Actualizado En',
    type: 'string',
    sortable: true,
    width: '140px',
  },
  {
    label: 'Actualizado Por',
    type: 'number',
    sortable: true,
    width: '120px',
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
