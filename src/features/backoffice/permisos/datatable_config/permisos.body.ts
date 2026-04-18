import type { Permisos, PermisosGridRow } from '../permisos.types';

export interface PermisosHandlers {
  onEdit: (permisos: Permisos) => void;
  onDelete: (permisos: Permisos) => void;
}

export const toPermisosGridRow = (permisos: Permisos, _handlers: PermisosHandlers): PermisosGridRow => ({
  id: permisos.id,
  codigo: permisos.codigo,
  descripcion: permisos.descripcion,
});

export const toPermisosGridRows = (permisos: Permisos[], handlers: PermisosHandlers): PermisosGridRow[] =>
  permisos.map((permisos) => toPermisosGridRow(permisos, handlers));
