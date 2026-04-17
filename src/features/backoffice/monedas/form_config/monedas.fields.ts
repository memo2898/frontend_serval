import { InputX } from '@/lib/uiX/components/InputX';
import type { Monedas } from '../monedas.types';

export function getMonedasFields(
  initialData: Monedas | null
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
      name: 'simbolo',
      label: 'Simbolo',
      placeholder: 'Ingrese simbolo',
      type: 'text',
      defaultValue: initialData?.simbolo != null ? String(initialData.simbolo) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Simbolo es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'decimales',
      label: 'Decimales',
      placeholder: 'Ingrese decimales',
      type: 'number',
      defaultValue: initialData?.decimales != null ? String(initialData.decimales) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Decimales es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
