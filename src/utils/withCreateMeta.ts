import { getUser } from '@/global/session.service';

/**
 * Inyecta los campos de auditoría requeridos por el backend en payloads de creación:
 *   - estado       (default: 'activo')
 *   - agregado_en  (ISO 8601 actual)
 *   - agregado_por (id del usuario en sesión)
 *
 * Uso:
 *   withCreateMeta({ ...dto })               // estado = 'activo'
 *   withCreateMeta({ ...dto }, 'reportado')  // estado personalizado
 */
export function withCreateMeta<T extends object>(
  data: T,
  estado = 'activo',
): T & { estado: string; agregado_en: string; agregado_por: number | null } {
  const user = getUser();
  const agregado_por = user?.id ?? null;

  return {
    ...data,
    estado,
    agregado_en: new Date().toISOString(),
    agregado_por,
  };
}
