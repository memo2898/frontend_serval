import type { GridieHeaderConfig } from '@/lib/gridie';

export const configuracionSucursalHeaders: GridieHeaderConfig[] = [
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
    label: 'Tiene Mesas',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Tiene Delivery',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Tiene Barra',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Impuesto Defecto Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Tarifa Defecto Id',
    type: 'number',
    sortable: true,
  },
  {
    label: 'Moneda',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Formato Fecha',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Zona Horaria',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Permite Venta Sin Stock',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Requiere Mesa Para Orden',
    type: 'boolean',
    sortable: true,
  },
  {
    label: 'Imprime Automatico Al Cerrar',
    type: 'boolean',
    sortable: true,
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
