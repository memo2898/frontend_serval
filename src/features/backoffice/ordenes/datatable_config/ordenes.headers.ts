import type { GridieHeaderConfig } from '@/lib/gridie';

export const ordenesHeaders: GridieHeaderConfig[] = [
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
    label: 'Turno Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Tipo Servicio',
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
    label: 'Numero Orden',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Descuento Total',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Subtotal',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Impuestos Total',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Total',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Notas',
    type: 'string',
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
