import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { OrdenLineaModificadores } from '../ordenlineamodificadores.types';

export function getOrdenLineaModificadoresFields(
  initialData: OrdenLineaModificadores | null,
  options: {
    ordenLineasOptions: Array<{ value: number; label: string }>;
    modificadoresOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'orden_linea_id',
      label: 'Orden Linea Id',
      placeholder: 'Seleccionar...',
      options: options.ordenLineasOptions ?? [],
      defaultValue: initialData?.orden_linea_id != null ? String(initialData.orden_linea_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    SelectX({
      name: 'modificador_id',
      label: 'Modificador Id',
      placeholder: 'Seleccionar...',
      options: options.modificadoresOptions ?? [],
      defaultValue: initialData?.modificador_id != null ? String(initialData.modificador_id) : '',
      rules: {
        validations: [
        ],
      },
    }),
    InputX({
      name: 'precio_extra',
      label: 'Precio Extra',
      placeholder: 'Ingrese precio extra',
      type: 'number',
      defaultValue: initialData?.precio_extra != null ? String(initialData.precio_extra) : '',
      rules: {
        validations: [
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
