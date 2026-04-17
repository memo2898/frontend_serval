import type { GridieHeaderConfig } from '@/lib/gridie';

export const mailHeaders: GridieHeaderConfig[] = [
  {
    label: 'Id',
    type: 'number',
    sortable: true,
    width: '80px',
  },
  {
    label: 'To',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Subject',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Html',
    type: 'string',
    sortable: true,
  },
  {
    label: 'Acciones',
    width: '240px',
  },
];
