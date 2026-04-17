import { InputX } from '@/lib/uiX/components/InputX';
import type { Utils } from '../utils.types';

export function getUtilsFields(
  initialData: Utils | null
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
          { type: 'required', message: 'Nombre es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'descripcion',
      label: 'Descripcion',
      placeholder: 'Ingrese descripcion',
      type: 'text',
      defaultValue: initialData?.descripcion != null ? String(initialData.descripcion) : '',
      rules: {
        validations: [
        ],
      },
    }),
  ];
}
