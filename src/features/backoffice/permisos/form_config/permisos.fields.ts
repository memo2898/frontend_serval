import { InputX } from '@/lib/uiX/components/InputX';
import type { Permisos } from '../permisos.types';

export function getPermisosFields(
  initialData: Permisos | null
): HTMLElement[] {
  return [
    InputX({
      name: 'codigo',
      label: 'Codigo',
      placeholder: 'Ingrese codigo',
      type: 'text',
      defaultValue: initialData?.codigo != null ? String(initialData.codigo) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Codigo es obligatorio' },
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
          { type: 'required', message: 'Descripcion es obligatorio' },
        ],
      },
    }),
  ];
}
