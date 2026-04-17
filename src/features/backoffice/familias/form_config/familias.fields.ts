import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Familias } from '../familias.types';

export function getFamiliasFields(
  initialData: Familias | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    // SelectX({
    //   name: 'sucursal_id',
    //   label: 'Sucursal Id',
    //   placeholder: 'Seleccionar...',
    //   options: options.sucursalesOptions ?? [],
    //   defaultValue: initialData?.sucursal_id != null ? String(initialData.sucursal_id) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Sucursal Id es obligatorio' },
    //     ],
    //   },
    // }),
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
    //   name: 'color',
    //   label: 'Color',
    //   placeholder: 'Ingrese color',
    //   type: 'text',
    //   defaultValue: initialData?.color != null ? String(initialData.color) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Color es obligatorio' },
    //       { type: 'maxLength', value: 255 },
    //     ],
    //   },
    // }),
    // InputX({
    //   name: 'icono',
    //   label: 'Icono',
    //   placeholder: 'Ingrese icono',
    //   type: 'text',
    //   defaultValue: initialData?.icono != null ? String(initialData.icono) : '',
    //   rules: {
    //     validations: [
    //       { type: 'required', message: 'Icono es obligatorio' },
    //       { type: 'maxLength', value: 255 },
    //     ],
    //   },
    // }),
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
    SelectX({
      name: 'destino_impresion',
      label: 'Destino Impresion',
      placeholder: 'Seleccionar...',
      options: [
        { value: 'cocina', label: 'Cocina' },
        { value: 'barra',  label: 'Barra'  },
        { value: 'caja',   label: 'Caja'   },
       // { value: 'ninguno',label: 'Ninguno'},
      ],
      defaultValue: initialData?.destino_impresion != null ? String(initialData.destino_impresion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Destino Impresion es obligatorio' },
        ],
      },
    }),
  ];
}
