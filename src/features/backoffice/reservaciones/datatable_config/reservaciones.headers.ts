import type { GridieHeaderConfig } from '@/lib/gridie';

export const reservacionesHeaders: GridieHeaderConfig[] = [
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
    label: 'Mesa Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Cliente Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Nombre Contacto',
    type: 'string',
    sortable: true,
    filters: {
      filterRow: { visible: true },
    },
  },
  {
    label: 'Telefono',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Fecha Hora',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Duracion Min',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Num Personas',
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
    label: 'Notas',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Cancelada En',
    type: 'string',
    sortable: true,
    width: '140px',
  },
  {
    label: 'Cancelada Por',
    type: 'number',
    sortable: true,
    width: '120px',
  },
  {
    label: 'Motivo Cancelacion',
    type: 'string',
    sortable: true,
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
