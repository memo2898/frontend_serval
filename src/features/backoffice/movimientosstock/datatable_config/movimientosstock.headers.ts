import type { GridieHeaderConfig } from '@/lib/gridie';

export const movimientosStockHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Articulo Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Sucursal Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Tipo',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Cantidad',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Referencia',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Orden Id',
    type: 'number',
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
    label: 'Acciones',
    width: '240px',
  },
];
