// ============================================
// Utils — filterExcluded
// ============================================

const EXCLUDED_VALUES = ['deleted', 'borrado', 'inactivo', 'excluido','eliminado'];

/**
 * Filtra del array los registros cuyo campo `estado` (u otro campo string)
 * coincida con alguno de los valores excluidos, sin distinguir mayúsculas.
 */
export function filterExcluded<T extends Record<string, any>>(items: T[]): T[] {
  return items.filter(item =>
    !Object.values(item).some(
      val => typeof val === 'string' && EXCLUDED_VALUES.includes(val.toLowerCase()),
    ),
  );
}
