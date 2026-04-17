import type { GridieHeaderConfig } from '@/lib/gridie';

export const articulosHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Familia Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Subfamilia Id',
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
    label: 'Descripcion',
    type: 'string',
    sortable: true,
    filters: {
      filterRow: { visible: true },
    },
  },
  // { label: 'Referencia',       type: 'string',  sortable: true },
  // { label: 'Codigo Barras',    type: 'string',  sortable: true },
  {
    label: 'Precio Venta',
    type: 'number',
    sortable: true,
  },
  // { label: 'Coste',            type: 'number',  sortable: true },
  // { label: 'Tiene Stock',      type: 'boolean', sortable: true },
  // { label: 'Vendido Por Peso', type: 'boolean', sortable: true, width: '120px' },
  // { label: 'Impuesto Id',      type: 'number',  sortable: true },
  // { label: 'Tiempo Preparacion', type: 'number', sortable: true },
  {
    label: 'Imagen',
    type: 'string',
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
    width: '370px',
  },
];
