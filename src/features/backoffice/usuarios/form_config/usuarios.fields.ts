import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { Usuarios } from '../usuarios.types';

export function getUsuariosFields(
  initialData: Usuarios | null,
  options: {
    sucursalesOptions: Array<{ value: number; label: string }>;
    rolesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
    SelectX({
      name: 'sucursal_id',
      label: 'Sucursal',
      placeholder: 'Seleccionar...',
      options: options.sucursalesOptions ?? [],
      defaultValue: initialData?.sucursal_id != null ? String(initialData.sucursal_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Sucursal es obligatorio' },
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
      name: 'apellido',
      label: 'Apellido',
      placeholder: 'Ingrese apellido',
      type: 'text',
      defaultValue: initialData?.apellido != null ? String(initialData.apellido) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Apellido es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'username',
      label: 'Username',
      placeholder: 'Ingrese username',
      type: 'text',
      defaultValue: initialData?.username != null ? String(initialData.username) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Username es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
    InputX({
      name: 'pin',
      label: 'Pin',
      placeholder: 'Ingrese pin',
      type: 'text',
      defaultValue: initialData?.pin != null ? String(initialData.pin) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Pin es obligatorio' },
          { type: 'maxLength', value: 255 },
        ],
      },
    }),
  ];
}
