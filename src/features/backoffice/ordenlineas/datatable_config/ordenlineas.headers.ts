import type { GridieHeaderConfig } from '@/lib/gridie';

export const ordenLineasHeaders: GridieHeaderConfig[] = [
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
    label: 'Articulo Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Cantidad',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Precio Unitario',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Descuento Linea',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Impuesto Linea',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Subtotal Linea',
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
    label: 'Enviado A Cocina',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Fecha Envio',
    type: 'string',
    sortable: true,
    width: '140px',
  },
  {
    label: 'Cuenta Num',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Notas Linea',
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
