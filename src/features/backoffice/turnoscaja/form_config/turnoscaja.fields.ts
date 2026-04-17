import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { TurnosCaja } from '../turnoscaja.types';

export function getTurnosCajaFields(
  initialData: TurnosCaja | null,
  options: {
    terminalesOptions: Array<{ value: number; label: string }>;
    usuariosOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'terminal_id',
      label: 'Terminal Id',
      placeholder: 'Seleccionar...',
      options: options.terminalesOptions ?? [],
      defaultValue: initialData?.terminal_id != null ? String(initialData.terminal_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Terminal Id es obligatorio' },
        ],
      },
    }),
    SelectX({
      name: 'usuario_id',
      label: 'Usuario Id',
      placeholder: 'Seleccionar...',
      options: options.usuariosOptions ?? [],
      defaultValue: initialData?.usuario_id != null ? String(initialData.usuario_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Usuario Id es obligatorio' },
        ],
      },
    }),
    InputX({
      name: 'fecha_apertura',
      label: 'Fecha Apertura',
      placeholder: 'Ingrese fecha apertura',
      type: 'text',
      defaultValue: initialData?.fecha_apertura != null ? String(initialData.fecha_apertura) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Fecha Apertura es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'fecha_cierre',
      label: 'Fecha Cierre',
      placeholder: 'Ingrese fecha cierre',
      type: 'text',
      defaultValue: initialData?.fecha_cierre != null ? String(initialData.fecha_cierre) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Fecha Cierre es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'monto_apertura',
      label: 'Monto Apertura',
      placeholder: 'Ingrese monto apertura',
      type: 'number',
      defaultValue: initialData?.monto_apertura != null ? String(initialData.monto_apertura) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Monto Apertura es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'monto_cierre_declarado',
      label: 'Monto Cierre Declarado',
      placeholder: 'Ingrese monto cierre declarado',
      type: 'number',
      defaultValue: initialData?.monto_cierre_declarado != null ? String(initialData.monto_cierre_declarado) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Monto Cierre Declarado es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
    InputX({
      name: 'monto_cierre_real',
      label: 'Monto Cierre Real',
      placeholder: 'Ingrese monto cierre real',
      type: 'number',
      defaultValue: initialData?.monto_cierre_real != null ? String(initialData.monto_cierre_real) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Monto Cierre Real es obligatorio' },
        ],
        restrictions: [{ type: 'onlyNumbers' }],
      },
    }),
  ];
}
