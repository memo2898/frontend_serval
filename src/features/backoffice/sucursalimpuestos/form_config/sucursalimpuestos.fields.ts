import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { SucursalImpuestos } from '../sucursalimpuestos.types';

export function getSucursalImpuestosFields(
  initialData: SucursalImpuestos | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
    impuestosOptions: Array<{ value: number; label: string }>;
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
    SelectX({
      name: 'impuesto_id',
      label: 'Impuesto Id',
      placeholder: 'Seleccionar...',
      options: options.impuestosOptions ?? [],
      defaultValue: initialData?.impuesto_id != null ? String(initialData.impuesto_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Impuesto Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'obligatorio',
      label: 'Obligatorio',
      placeholder: 'Ingrese obligatorio',
      type: 'checkbox',
      defaultValue: initialData?.obligatorio != null ? String(initialData.obligatorio) : '',
    }),
    InputX({
      name: 'orden_aplicacion',
      label: 'Orden Aplicacion',
      placeholder: 'Ingrese orden aplicacion',
      type: 'number',
      defaultValue: initialData?.orden_aplicacion != null ? String(initialData.orden_aplicacion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Orden Aplicacion es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
