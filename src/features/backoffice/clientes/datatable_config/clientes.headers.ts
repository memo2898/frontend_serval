import type { GridieHeaderConfig } from '@/lib/gridie';

export const clientesHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Empresa Id',
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
    label: 'Apellido',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Email',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Telefono',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Tipo Documento Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Numero Documento',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Direccion',
    type: 'string',
    sortable: true,
    filters: {
      filterRow: { visible: true },
    },
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
