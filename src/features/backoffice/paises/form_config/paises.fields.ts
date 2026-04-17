import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Paises } from '../paises.types';

export function getPaisesFields(
  initialData: Paises | null,
  options: {
    monedasOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
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
      name: 'codigo_iso',
      label: 'Codigo Iso',
      placeholder: 'Ingrese codigo iso',
      type: 'text',
      defaultValue: initialData?.codigo_iso != null ? String(initialData.codigo_iso) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 2 },
        ],
        restrictions: [
          {type:'maxChars', value: 2},
        ],
      },
    }),
    SelectX({
      name: 'moneda_id',
      label: 'Moneda Id',
      placeholder: 'Seleccionar...',
      options: options.monedasOptions ?? [],
      defaultValue: initialData?.moneda_id != null ? String(initialData.moneda_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
  ];
}
