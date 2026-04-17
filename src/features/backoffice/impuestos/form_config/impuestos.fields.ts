import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Impuestos } from '../impuestos.types';

export function getImpuestosFields(
  initialData: Impuestos | null,
  options: {
    paisesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'pais_id',
      label: 'Pais Id',
      placeholder: 'Seleccionar...',
      options: options.paisesOptions ?? [],
      defaultValue: initialData?.pais_id != null ? String(initialData.pais_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Pais Id es obligatorio' },
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
      name: 'porcentaje',
      label: 'Porcentaje',
      placeholder: 'Ingrese porcentaje',
      type: 'number',
      defaultValue: initialData?.porcentaje != null ? String(initialData.porcentaje) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Porcentaje es obligatorio' },
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
      name: 'tipo_aplicacion',
      label: 'Tipo Aplicacion',
      placeholder: 'Ingrese tipo aplicacion',
      type: 'text',
      defaultValue: initialData?.tipo_aplicacion != null ? String(initialData.tipo_aplicacion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tipo Aplicacion es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
