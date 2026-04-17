import type { GridieHeaderConfig } from '@/lib/gridie';

export const mesasHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Zona Id',
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
    label: 'Capacidad',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Mesa Principal Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Posicion X',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Posicion Y',
    type: 'number',
    sortable: true,
  },
  // {
  //   label: 'Estado',
  //   type: 'string',
  //   sortable: true,
  //   width: '100px',
  //   filters: {
  //     headerFilter: { visible: true, showCount: true },
  //   },
  // },
  // {
  //   label: 'Agregado En',
  //   type: 'string',
  //   sortable: true,
  //   width: '140px',
  // },
  // {
  //   label: 'Agregado Por',
  //   type: 'number',
  //   sortable: true,
  //   width: '120px',
  // },
  // {
  //   label: 'Actualizado En',
  //   type: 'string',
  //   sortable: true,
  //   width: '140px',
  // },
  // {
  //   label: 'Actualizado Por',
  //   type: 'number',
  //   sortable: true,
  //   width: '120px',
  // },
  {
    label: 'Acciones',
    width: '240px',
  },
];
