import { getUser } from '@/global/session.service';

/**
 * Inyecta los campos de auditoría requeridos por el backend en payloads de actualización:
 *   - actualizado_en  (ISO 8601 actual)
 *   - actualizado_por (id del usuario en sesión)
 *
 * Uso:
 *   withUpdateMeta({ ...dto })
 */
export function withUpdateMeta<T extends object>(
  data: T,
): T & { actualizado_en: string; actualizado_por: number | null } {
  const user = getUser();
  const actualizado_por = user?.id ?? null;

  return {
    ...data,
    actualizado_en: new Date().toISOString(),
    actualizado_por,
  };
}
