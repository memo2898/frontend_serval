import { SelectX } from '@/lib/uiX/components/SelectX';
import type { ArticuloAlergenos } from '../articuloalergenos.types';

export function getArticuloAlergenosFields(
  initialData: ArticuloAlergenos | null,
  options: {
    articulosOptions: Array<{ value: number; label: string }>;
    alergenosOptions: Array<{ value: number; label: string }>;
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
      name: 'alergeno_id',
      label: 'Alergeno Id',
      placeholder: 'Seleccionar...',
      options: options.alergenosOptions ?? [],
      defaultValue: initialData?.alergeno_id != null ? String(initialData.alergeno_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Alergeno Id es obligatorio' },
        ],
      },
    }),
  ];
}
