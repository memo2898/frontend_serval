import type { GridieHeaderConfig } from '@/lib/gridie';

export const tipoDocumentosHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'Tipo',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Aplica A',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Tipo Validacion',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Regex Validacion',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Funcion Validacion',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Formato Ejemplo',
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
