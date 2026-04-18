import { SelectX } from '@/lib/uiX/components/SelectX';
import type { RolPermiso } from '../rolpermiso.types';

export function getRolPermisoFields(
  initialData: RolPermiso | null,
  options: {
    rolesOptions: Array<{ value: number; label: string }>;
    permisosOptions: Array<{ value: number; label: string }>;
  }
): HTMLElement[] {
  return [
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
    SelectX({
      name: 'permiso_id',
      label: 'Permiso Id',
      placeholder: 'Seleccionar...',
      options: options.permisosOptions ?? [],
      defaultValue: initialData?.permiso_id != null ? String(initialData.permiso_id) : '',
      rules: {
        validations: [
          { type: 'required', message: 'Permiso Id es obligatorio' },
        ],
      },
    }),
  ];
}
