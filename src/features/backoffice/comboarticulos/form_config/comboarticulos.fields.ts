import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { ComboArticulos } from '../comboarticulos.types';

export function getComboArticulosFields(
  initialData: ComboArticulos | null,
  options: {
    combosOptions: Array<{ value: number; label: string }>;
    articulosOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'combo_id',
      label: 'Combo Id',
      placeholder: 'Seleccionar...',
      options: options.combosOptions ?? [],
      defaultValue: initialData?.combo_id != null ? String(initialData.combo_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Combo Id es obligatorio' },
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
      name: 'precio_especial',
      label: 'Precio Especial',
      placeholder: 'Ingrese precio especial',
      type: 'number',
      defaultValue: initialData?.precio_especial != null ? String(initialData.precio_especial) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Precio Especial es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
