import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Stock } from '../stock.types';

export function getStockFields(
  initialData: Stock | null,
  options: {
    articulosOptions: Array<{ value: number; label: string }>;
    sucursalesOptions: Array<{ value: number; label: string }>;
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
      name: 'cantidad_actual',
      label: 'Cantidad Actual',
      placeholder: 'Ingrese cantidad actual',
      type: 'number',
      defaultValue: initialData?.cantidad_actual != null ? String(initialData.cantidad_actual) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Cantidad Actual es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'cantidad_minima',
      label: 'Cantidad Minima',
      placeholder: 'Ingrese cantidad minima',
      type: 'number',
      defaultValue: initialData?.cantidad_minima != null ? String(initialData.cantidad_minima) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Cantidad Minima es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
