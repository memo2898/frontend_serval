import { InputX } from '@/lib/uiX/components/InputX';
import type { Alergenos } from '../alergenos.types';

export function getAlergenosFields(
  initialData: Alergenos | null
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
      name: 'icono',
      label: 'Icono',
      placeholder: 'Ingrese icono',
      type: 'text',
      defaultValue: initialData?.icono != null ? String(initialData.icono) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Icono es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
