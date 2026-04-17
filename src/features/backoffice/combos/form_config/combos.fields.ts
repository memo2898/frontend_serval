import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Combos } from '../combos.types';

export function getCombosFields(
  initialData: Combos | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'sucursal_id',
      label: 'Sucursal Id',
      placeholder: 'Seleccionar...',
      options: options.sucursalesOptions ?? [],
      defaultValue: initialData?.sucursal_id != null ? String(initialData.sucursal_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Sucursal Id es obligatorio' },
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
      name: 'precio',
      label: 'Precio',
      placeholder: 'Ingrese precio',
      type: 'number',
      defaultValue: initialData?.precio != null ? String(initialData.precio) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Precio es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
