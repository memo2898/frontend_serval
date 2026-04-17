import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Subfamilias } from '../subfamilias.types';

export function getSubfamiliasFields(
  initialData: Subfamilias | null,
  options: {
    familiasOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'familia_id',
      label: 'Familia Id',
      placeholder: 'Seleccionar...',
      options: options.familiasOptions ?? [],
      defaultValue: initialData?.familia_id != null ? String(initialData.familia_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Familia Id es obligatorio' },
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
    // InputX({
    //   name: 'orden_visual',
    //   label: 'Orden Visual',
    //   placeholder: 'Ingrese orden visual',
    //   type: 'number',
    //   defaultValue: initialData?.orden_visual != null ? String(initialData.orden_visual) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Orden Visual es obligatorio' },
    //     ],
    //     restrictions: [{ type: 'onlyNumbers' }],
    //   },
    // }),
  ];
}
