import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Mesas } from '../mesas.types';

export function getMesasFields(
  initialData: Mesas | null,
  options: {
    zonasOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'zona_id',
      label: 'Zona Id',
      placeholder: 'Seleccionar...',
      options: options.zonasOptions ?? [],
      defaultValue: initialData?.zona_id != null ? String(initialData.zona_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Zona Id es obligatorio' },
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
      name: 'capacidad',
      label: 'Capacidad',
      placeholder: 'Ingrese capacidad',
      type: 'number',
      defaultValue: initialData?.capacidad != null ? String(initialData.capacidad) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Capacidad es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    // InputX({
    //   name: 'mesa_principal_id',
    //   label: 'Mesa Principal Id',
    //   placeholder: 'Ingrese mesa principal id',
    //   type: 'number',
    //   defaultValue: initialData?.mesa_principal_id != null ? String(initialData.mesa_principal_id) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Mesa Principal Id es obligatorio' },
    //       { type: 'positive' },
    //       { type: 'integer' },
    //     ],
    //     restrictions: [{ type: 'onlyNumbers' }],
    //   },
    // }),
    // InputX({
    //   name: 'posicion_x',
    //   label: 'Posicion X',
    //   placeholder: 'Ingrese posicion x',
    //   type: 'number',
    //   defaultValue: initialData?.posicion_x != null ? String(initialData.posicion_x) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Posicion X es obligatorio' },
    //     ],
    //     restrictions: [{ type: 'onlyNumbers' }],
    //   },
    // }),
    // InputX({
    //   name: 'posicion_y',
    //   label: 'Posicion Y',
    //   placeholder: 'Ingrese posicion y',
    //   type: 'number',
    //   defaultValue: initialData?.posicion_y != null ? String(initialData.posicion_y) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Posicion Y es obligatorio' },
    //     ],
    //     restrictions: [{ type: 'onlyNumbers' }],
    //   },
    // }),
  ];
}
