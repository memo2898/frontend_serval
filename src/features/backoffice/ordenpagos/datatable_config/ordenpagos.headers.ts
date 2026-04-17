import type { GridieHeaderConfig } from '@/lib/gridie';

export const ordenPagosHeaders: GridieHeaderConfig[] = [
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
    label: 'Forma Pago Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Monto',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Referencia',
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
    label: 'Acciones',
    width: '240px',
  },
];
