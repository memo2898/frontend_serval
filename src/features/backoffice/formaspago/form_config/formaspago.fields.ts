import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { FormasPago } from '../formaspago.types';

export function getFormasPagoFields(
  initialData: FormasPago | null,
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
      name: 'tipo',
      label: 'Tipo',
      placeholder: 'Ingrese tipo',
      type: 'text',
      defaultValue: initialData?.tipo != null ? String(initialData.tipo) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tipo es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'requiere_referencia',
      label: 'Requiere Referencia',
      placeholder: 'Ingrese requiere referencia',
      type: 'checkbox',
      defaultValue: initialData?.requiere_referencia != null ? String(initialData.requiere_referencia) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Requiere Referencia es obligatorio' },
        ],
      },
    }),
  ];
}
