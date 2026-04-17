import { InputX } from '@/lib/uiX/components/InputX';
import type { Paises } from '../paises.types';

export function getPaisesFields(
  initialData: Paises | null
): HTMLElement[] {
  return [
    InputX({
      name: 'nombre',
      label: 'Nombre',
      placeholder: 'Ingrese nombre',
      type: 'text',
      defaultValue: initialData?.nombre != null ? String(initialData.nombre) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'codigo_iso',
      label: 'Codigo Iso',
      placeholder: 'Ingrese codigo iso',
      type: 'text',
      defaultValue: initialData?.codigo_iso != null ? String(initialData.codigo_iso) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'moneda_defecto',
      label: 'Moneda Defecto',
      placeholder: 'Ingrese moneda defecto',
      type: 'text',
      defaultValue: initialData?.moneda_defecto != null ? String(initialData.moneda_defecto) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
