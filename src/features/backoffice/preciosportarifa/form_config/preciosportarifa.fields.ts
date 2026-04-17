import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { PreciosPorTarifa } from '../preciosportarifa.types';

export function getPreciosPorTarifaFields(
  initialData: PreciosPorTarifa | null,
  options: {
    articulosOptions: Array<{ value: number; label: string }>;
    tarifasOptions: Array<{ value: number; label: string }>;
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
      name: 'tarifa_id',
      label: 'Tarifa Id',
      placeholder: 'Seleccionar...',
      options: options.tarifasOptions ?? [],
      defaultValue: initialData?.tarifa_id != null ? String(initialData.tarifa_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Tarifa Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'precio',
      label: 'Precio',
      placeholder: 'Ingrese precio',
      type: 'number',
      defaultValue: initialData?.precio != null ? String(initialData.precio) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Precio es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
