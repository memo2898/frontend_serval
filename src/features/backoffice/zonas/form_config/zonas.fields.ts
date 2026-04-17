import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Zonas } from '../zonas.types';

export function getZonasFields(
  initialData: Zonas | null,
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
      name: 'orden_visual',
      label: 'Orden Visual',
      placeholder: 'Ingrese orden visual',
      type: 'number',
      defaultValue: initialData?.orden_visual != null ? String(initialData.orden_visual) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Orden Visual es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
