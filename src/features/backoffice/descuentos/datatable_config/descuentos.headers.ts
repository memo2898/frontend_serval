import type { GridieHeaderConfig } from '@/lib/gridie';

export const descuentosHeaders: GridieHeaderConfig[] = [
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
    label: 'Nombre',
    type: 'string',
    sortable: true,
    filters: {
      filterRow: { visible: true },
    },
  },
  {
    label: 'Tipo',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Valor',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Aplica A',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Requiere Autorizacion',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Fecha Inicio',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Fecha Fin',
    type: 'string',
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
