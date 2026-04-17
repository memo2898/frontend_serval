import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { OrdenLineas } from '../ordenlineas.types';

export function getOrdenLineasFields(
  initialData: OrdenLineas | null,
  options: {
    ordenesOptions: Array<{ value: number; label: string }>;
    articulosOptions: Array<{ value: number; label: string }>;
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
      name: 'articulo_id',
      label: 'Articulo Id',
      placeholder: 'Seleccionar...',
      options: options.articulosOptions ?? [],
      defaultValue: initialData?.articulo_id != null ? String(initialData.articulo_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Articulo Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'cantidad',
      label: 'Cantidad',
      placeholder: 'Ingrese cantidad',
      type: 'number',
      defaultValue: initialData?.cantidad != null ? String(initialData.cantidad) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Cantidad es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'precio_unitario',
      label: 'Precio Unitario',
      placeholder: 'Ingrese precio unitario',
      type: 'number',
      defaultValue: initialData?.precio_unitario != null ? String(initialData.precio_unitario) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Precio Unitario es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'descuento_linea',
      label: 'Descuento Linea',
      placeholder: 'Ingrese descuento linea',
      type: 'number',
      defaultValue: initialData?.descuento_linea != null ? String(initialData.descuento_linea) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Descuento Linea es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'impuesto_linea',
      label: 'Impuesto Linea',
      placeholder: 'Ingrese impuesto linea',
      type: 'number',
      defaultValue: initialData?.impuesto_linea != null ? String(initialData.impuesto_linea) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Impuesto Linea es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'subtotal_linea',
      label: 'Subtotal Linea',
      placeholder: 'Ingrese subtotal linea',
      type: 'number',
      defaultValue: initialData?.subtotal_linea != null ? String(initialData.subtotal_linea) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Subtotal Linea es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'enviado_a_cocina',
      label: 'Enviado A Cocina',
      placeholder: 'Ingrese enviado a cocina',
      type: 'checkbox',
      defaultValue: initialData?.enviado_a_cocina != null ? String(initialData.enviado_a_cocina) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Enviado A Cocina es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'fecha_envio',
      label: 'Fecha Envio',
      placeholder: 'Ingrese fecha envio',
      type: 'text',
      defaultValue: initialData?.fecha_envio != null ? String(initialData.fecha_envio) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Fecha Envio es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'cuenta_num',
      label: 'Cuenta Num',
      placeholder: 'Ingrese cuenta num',
      type: 'number',
      defaultValue: initialData?.cuenta_num != null ? String(initialData.cuenta_num) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Cuenta Num es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'notas_linea',
      label: 'Notas Linea',
      placeholder: 'Ingrese notas linea',
      type: 'text',
      defaultValue: initialData?.notas_linea != null ? String(initialData.notas_linea) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Notas Linea es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
