import { SelectX } from '@/lib/uiX/components/SelectX';
import type { ArticuloImpuestos } from '../articuloimpuestos.types';

export function getArticuloImpuestosFields(
  initialData: ArticuloImpuestos | null,
  options: {
    articulosOptions: Array<{ value: number; label: string }>;
    impuestosOptions: Array<{ value: number; label: string }>;
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
  ];
}
