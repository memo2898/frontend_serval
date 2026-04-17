import { InputX } from '@/lib/uiX/components/InputX';
import type { Roles } from '../roles.types';

export function getRolesFields(
  initialData: Roles | null
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
