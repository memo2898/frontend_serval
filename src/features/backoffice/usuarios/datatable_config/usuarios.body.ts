import type { Usuarios, UsuariosGridRow } from '../usuarios.types';

export interface UsuariosHandlers {
  onEdit: (usuarios: Usuarios) => void;
  onDelete: (usuarios: Usuarios) => void;
  onRoles: (usuarios: Usuarios) => void;
}

const actionButtonStyles = `
  <style>
    .btn-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid transparent;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      background: transparent;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 105px;
    }
    .btn-action:not(:last-child) { margin-right: 8px; }
    .btn-action:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .btn-action:active { transform: translateY(0); }
    .btn-action svg { flex-shrink: 0; }
    .btn-edit   { color: #2563eb; border-color: #dbeafe; background: #eff6ff; }
    .btn-edit:hover   { background: #dbeafe; border-color: #93c5fd; }
    .btn-edit:active  { background: #bfdbfe; }
    .btn-roles  { color: #7c3aed; border-color: #ede9fe; background: #f5f3ff; }
    .btn-roles:hover  { background: #ede9fe; border-color: #c4b5fd; }
    .btn-roles:active { background: #ddd6fe; }
    .btn-delete { color: #dc2626; border-color: #fee2e2; background: #fef2f2; }
    .btn-delete:hover   { background: #fee2e2; border-color: #fecaca; }
    .btn-delete:active  { background: #fecaca; }
    @media (max-width: 768px) {
      .btn-action span { display: none; }
      .btn-action { padding: 8px; min-width: 36px; }
    }
  </style>
`;

export const toUsuariosGridRow = (usuarios: Usuarios, handlers: UsuariosHandlers): UsuariosGridRow => ({
  id: usuarios.id,
  sucursal_id: usuarios.sucursal_id,

  nombre: usuarios.nombre,
  apellido: usuarios.apellido,
  username: usuarios.username,
  //pin: usuarios.pin,
 // estado: usuarios.estado,
  // agregado_en: usuarios.agregado_en,
  // agregado_por: usuarios.agregado_por,
  // actualizado_en: usuarios.actualizado_en,
  // actualizado_por: usuarios.actualizado_por,
  actions: [
    {
      content: `
        ${actionButtonStyles}
        <button class="btn-action btn-edit" title="Editar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span>Editar</span>
        </button>
      `,
      event: 'click',
      funct: () => handlers.onEdit(usuarios),
    },
    {
      content: `
        <button class="btn-action btn-roles" title="Roles">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Roles</span>
        </button>
      `,
      event: 'click',
      funct: () => handlers.onRoles(usuarios),
    },
    {
      content: `
        <button class="btn-action btn-delete" title="Eliminar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          <span>Eliminar</span>
        </button>
      `,
      event: 'click',
      funct: () => handlers.onDelete(usuarios),
    },
  ],
});

export const toUsuariosGridRows = (usuarios: Usuarios[], handlers: UsuariosHandlers): UsuariosGridRow[] =>
  usuarios.map((usuarios) => toUsuariosGridRow(usuarios, handlers));
