import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Descuentos } from '../descuentos.types';

export function getDescuentosFields(
  initialData: Descuentos | null,
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
      name: 'valor',
      label: 'Valor',
      placeholder: 'Ingrese valor',
      type: 'number',
      defaultValue: initialData?.valor != null ? String(initialData.valor) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Valor es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'aplica_a',
      label: 'Aplica A',
      placeholder: 'Ingrese aplica a',
      type: 'text',
      defaultValue: initialData?.aplica_a != null ? String(initialData.aplica_a) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Aplica A es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'requiere_autorizacion',
      label: 'Requiere Autorizacion',
      placeholder: 'Ingrese requiere autorizacion',
      type: 'checkbox',
      defaultValue: initialData?.requiere_autorizacion != null ? String(initialData.requiere_autorizacion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Requiere Autorizacion es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'fecha_inicio',
      label: 'Fecha Inicio',
      placeholder: 'Ingrese fecha inicio',
      type: 'text',
      defaultValue: initialData?.fecha_inicio != null ? String(initialData.fecha_inicio) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Fecha Inicio es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'fecha_fin',
      label: 'Fecha Fin',
      placeholder: 'Ingrese fecha fin',
      type: 'text',
      defaultValue: initialData?.fecha_fin != null ? String(initialData.fecha_fin) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Fecha Fin es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
