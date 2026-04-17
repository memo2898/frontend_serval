import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Articulos } from '../articulos.types';

export function getArticulosFields(
  initialData: Articulos | null,
  options: {
    familiasOptions: Array<{ value: number; label: string }>;
    subfamiliasOptions: Array<{ value: number; label: string }>;
    impuestosOptions: Array<{ value: number; label: string }>;
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
    SelectX({
      name: 'subfamilia_id',
      label: 'Subfamilia Id',
      placeholder: 'Seleccionar...',
      options: options.subfamiliasOptions ?? [],
      defaultValue: initialData?.subfamilia_id != null ? String(initialData.subfamilia_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Subfamilia Id es obligatorio' },
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
      name: 'descripcion',
      label: 'Descripcion',
      placeholder: 'Ingrese descripcion',
      type: 'text',
      defaultValue: initialData?.descripcion != null ? String(initialData.descripcion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Descripcion es obligatorio' },
        ],
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
    InputX({
      name: 'codigo_barras',
      label: 'Codigo Barras',
      placeholder: 'Ingrese codigo barras',
      type: 'text',
      defaultValue: initialData?.codigo_barras != null ? String(initialData.codigo_barras) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Codigo Barras es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'precio_venta',
      label: 'Precio Venta',
      placeholder: 'Ingrese precio venta',
      type: 'number',
      defaultValue: initialData?.precio_venta != null ? String(initialData.precio_venta) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Precio Venta es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'coste',
      label: 'Coste',
      placeholder: 'Ingrese coste',
      type: 'number',
      defaultValue: initialData?.coste != null ? String(initialData.coste) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Coste es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'tiene_stock',
      label: 'Tiene Stock',
      placeholder: 'Ingrese tiene stock',
      type: 'checkbox',
      defaultValue: initialData?.tiene_stock != null ? String(initialData.tiene_stock) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tiene Stock es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'vendido_por_peso',
      label: 'Vendido Por Peso',
      placeholder: 'Ingrese vendido por peso',
      type: 'checkbox',
      defaultValue: initialData?.vendido_por_peso != null ? String(initialData.vendido_por_peso) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Vendido Por Peso es obligatorio' },
        ],
      },
    }),
    SelectX({
      name: 'impuesto_id',
      label: 'Impuesto Id',
      placeholder: 'Seleccionar...',
      options: options.impuestosOptions ?? [],
      defaultValue: initialData?.impuesto_id != null ? String(initialData.impuesto_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Impuesto Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'tiempo_preparacion',
      label: 'Tiempo Preparacion',
      placeholder: 'Ingrese tiempo preparacion',
      type: 'number',
      defaultValue: initialData?.tiempo_preparacion != null ? String(initialData.tiempo_preparacion) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tiempo Preparacion es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'imagen',
      label: 'Imagen',
      placeholder: 'Ingrese imagen',
      type: 'text',
      defaultValue: initialData?.imagen != null ? String(initialData.imagen) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Imagen es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
