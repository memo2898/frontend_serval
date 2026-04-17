import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Facturas } from '../facturas.types';

export function getFacturasFields(
  initialData: Facturas | null,
  options: {
    ordenesOptions: Array<{ value: number; label: string }>;
    clientesOptions: Array<{ value: number; label: string }>;
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
    SelectX({
      name: 'cliente_id',
      label: 'Cliente Id',
      placeholder: 'Seleccionar...',
      options: options.clientesOptions ?? [],
      defaultValue: initialData?.cliente_id != null ? String(initialData.cliente_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Cliente Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'numero_factura',
      label: 'Numero Factura',
      placeholder: 'Ingrese numero factura',
      type: 'text',
      defaultValue: initialData?.numero_factura != null ? String(initialData.numero_factura) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Numero Factura es obligatorio' },
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
      name: 'subtotal',
      label: 'Subtotal',
      placeholder: 'Ingrese subtotal',
      type: 'number',
      defaultValue: initialData?.subtotal != null ? String(initialData.subtotal) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Subtotal es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'impuestos',
      label: 'Impuestos',
      placeholder: 'Ingrese impuestos',
      type: 'number',
      defaultValue: initialData?.impuestos != null ? String(initialData.impuestos) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Impuestos es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'total',
      label: 'Total',
      placeholder: 'Ingrese total',
      type: 'number',
      defaultValue: initialData?.total != null ? String(initialData.total) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Total es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'anulada',
      label: 'Anulada',
      placeholder: 'Ingrese anulada',
      type: 'checkbox',
      defaultValue: initialData?.anulada != null ? String(initialData.anulada) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Anulada es obligatorio' },
        ],
      },
    }),
  ];
}
