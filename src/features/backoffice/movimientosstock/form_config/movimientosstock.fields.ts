import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { MovimientosStock } from '../movimientosstock.types';

export function getMovimientosStockFields(
  initialData: MovimientosStock | null,
  options: {
    articulosOptions: Array<{ value: number; label: string }>;
    sucursalesOptions: Array<{ value: number; label: string }>;
    ordenesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
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
  ];
}
