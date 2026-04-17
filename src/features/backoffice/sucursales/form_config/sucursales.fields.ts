import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Sucursales } from '../sucursales.types';

export function getSucursalesFields(
  initialData: Sucursales | null,
  options: {
    empresasOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'empresa_id',
      label: 'Empresa Id',
      placeholder: 'Seleccionar...',
      options: options.empresasOptions ?? [],
      defaultValue: initialData?.empresa_id != null ? String(initialData.empresa_id) : '',
      rules: {
        validations: [
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
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'direccion',
      label: 'Direccion',
      placeholder: 'Ingrese direccion',
      type: 'text',
      defaultValue: initialData?.direccion != null ? String(initialData.direccion) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'telefono',
      label: 'Telefono',
      placeholder: 'Ingrese telefono',
      type: 'text',
      defaultValue: initialData?.telefono != null ? String(initialData.telefono) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
        restrictions:[
          { type: 'onlyNumbers' },
        ]
      },
    }),
  ];
}
