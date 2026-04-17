import type { GridieHeaderConfig } from '@/lib/gridie';

export const movimientosCajaHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Turno Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Tipo',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Monto',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Concepto',
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
