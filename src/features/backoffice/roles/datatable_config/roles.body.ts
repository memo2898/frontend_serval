import type { Roles, RolesGridRow } from '../roles.types';

export interface RolesHandlers {
  onEdit: (roles: Roles) => void;
  onDelete: (roles: Roles) => void;
}

export const toRolesGridRow = (roles: Roles, _handlers: RolesHandlers): RolesGridRow => ({
  id: roles.id,
  nombre: roles.nombre,
  descripcion: roles.descripcion,
});

export const toRolesGridRows = (roles: Roles[], handlers: RolesHandlers): RolesGridRow[] =>
  roles.map((roles) => toRolesGridRow(roles, handlers));
