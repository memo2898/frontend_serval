import { InputX } from '@/lib/uiX/components/InputX';
import { SelectX } from '@/lib/uiX/components/SelectX';
import type { UsuarioRol } from '../usuariorol.types';

export function getUsuarioRolFields(
  initialData: UsuarioRol | null,
  options: {
    usuariosOptions: Array<{ value: number; label: string }>;
    rolesOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
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
    SelectX({
      name: 'rol_id',
      label: 'Rol Id',
      placeholder: 'Seleccionar...',
      options: options.rolesOptions ?? [],
      defaultValue: initialData?.rol_id != null ? String(initialData.rol_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Rol Id es obligatorio' },
        ],
      },
    }),
  ];
}
