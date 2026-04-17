import type { GridieHeaderConfig } from '@/lib/gridie';

export const facturasHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Orden Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Cliente Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Numero Factura',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Tipo',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Subtotal',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Impuestos',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Total',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Anulada',
    type: 'boolean',
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
