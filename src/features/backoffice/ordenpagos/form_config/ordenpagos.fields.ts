import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { OrdenPagos } from '../ordenpagos.types';

export function getOrdenPagosFields(
  initialData: OrdenPagos | null,
  options: {
    ordenesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'orden_id',
      label: 'Orden Id',
      placeholder: 'Seleccionar...',
      options: options.ordenesOptions ?? [],
      defaultValue: initialData?.orden_id != null ? String(initialData.orden_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Orden Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'forma_pago_id',
      label: 'Forma Pago Id',
      placeholder: 'Ingrese forma pago id',
      type: 'number',
      defaultValue: initialData?.forma_pago_id != null ? String(initialData.forma_pago_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Forma Pago Id es obligatorio' },
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'monto',
      label: 'Monto',
      placeholder: 'Ingrese monto',
      type: 'number',
      defaultValue: initialData?.monto != null ? String(initialData.monto) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Monto es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'referencia',
      label: 'Referencia',
      placeholder: 'Ingrese referencia',
      type: 'text',
      defaultValue: initialData?.referencia != null ? String(initialData.referencia) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Referencia es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
