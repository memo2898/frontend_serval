import { InputX } from '@/lib/uiX/components/InputX';
import type { Modificadores } from '../modificadores.types';

export function getModificadoresFields(
  initialData: Modificadores | null
): HTMLElement[] {
  return [
    InputX({
      name: 'grupo_modificador_id',
      label: 'Grupo Modificador Id',
      placeholder: 'Ingrese grupo modificador id',
      type: 'number',
      defaultValue: initialData?.grupo_modificador_id != null ? String(initialData.grupo_modificador_id) : '',
      rules: {
        validations: [
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
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
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'precio_extra',
      label: 'Precio Extra',
      placeholder: 'Ingrese precio extra',
      type: 'number',
      defaultValue: initialData?.precio_extra != null ? String(initialData.precio_extra) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'orden_visual',
      label: 'Orden Visual',
      placeholder: 'Ingrese orden visual',
      type: 'number',
      defaultValue: initialData?.orden_visual != null ? String(initialData.orden_visual) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
