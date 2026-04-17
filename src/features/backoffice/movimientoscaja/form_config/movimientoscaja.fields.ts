import { InputX } from '@/lib/uiX/components/InputX';
import type { MovimientosCaja } from '../movimientoscaja.types';

export function getMovimientosCajaFields(
  initialData: MovimientosCaja | null
): HTMLElement[] {
  return [
    InputX({
      name: 'turno_id',
      label: 'Turno Id',
      placeholder: 'Ingrese turno id',
      type: 'number',
      defaultValue: initialData?.turno_id != null ? String(initialData.turno_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Turno Id es obligatorio' },
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
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
      name: 'concepto',
      label: 'Concepto',
      placeholder: 'Ingrese concepto',
      type: 'text',
      defaultValue: initialData?.concepto != null ? String(initialData.concepto) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Concepto es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
