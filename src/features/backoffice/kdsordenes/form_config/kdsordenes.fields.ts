import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { KdsOrdenes } from '../kdsordenes.types';

export function getKdsOrdenesFields(
  initialData: KdsOrdenes | null,
  options: {
    ordenLineasOptions: Array<{ value: number; label: string }>;
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
    InputX({
      name: 'destino_id',
      label: 'Destino Id',
      placeholder: 'Ingrese destino id',
      type: 'number',
      defaultValue: initialData?.destino_id != null ? String(initialData.destino_id) : '',
      rules: {
        validations: [
          { type: 'positive' },
          { type: 'integer' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'tiempo_recibido',
      label: 'Tiempo Recibido',
      placeholder: 'Ingrese tiempo recibido',
      type: 'text',
      defaultValue: initialData?.tiempo_recibido != null ? String(initialData.tiempo_recibido) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'tiempo_preparado',
      label: 'Tiempo Preparado',
      placeholder: 'Ingrese tiempo preparado',
      type: 'text',
      defaultValue: initialData?.tiempo_preparado != null ? String(initialData.tiempo_preparado) : '',
      rules: {
        validations: [
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
