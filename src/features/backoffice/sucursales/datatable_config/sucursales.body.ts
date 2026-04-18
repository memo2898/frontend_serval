import type { Sucursales, SucursalesGridRow } from '../sucursales.types';

export interface SucursalesHandlers {
  onEdit: (sucursales: Sucursales) => void;
  onDelete: (sucursales: Sucursales) => void;
  onImpuestos: (sucursales: Sucursales) => void;
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
    .btn-delete { color: #dc2626; border-color: #fee2e2; background: #fef2f2; }
    .btn-delete:hover   { background: #fee2e2; border-color: #fecaca; }
    .btn-delete:active  { background: #fecaca; }
    .btn-impuestos { color: #0891b2; border-color: #bae6fd; background: #f0f9ff; }
    .btn-impuestos:hover  { background: #bae6fd; border-color: #7dd3fc; }
    .btn-impuestos:active { background: #7dd3fc; }
    @media (max-width: 768px) {
      .btn-action span { display: none; }
      .btn-action { padding: 8px; min-width: 36px; }
    }
  </style>
`;

export const toSucursalesGridRow = (sucursales: Sucursales, handlers: SucursalesHandlers): SucursalesGridRow => ({
  id: sucursales.id,
  //empresa_id: sucursales.empresa_id,
  empresa:sucursales.empresa?.nombre,
  nombre: sucursales.nombre,
  direccion: sucursales.direccion,
  telefono: sucursales.telefono,
  estado: sucursales.estado,
  agregado_en: sucursales.agregado_en,
  agregado_por: sucursales.agregado_por,
  actualizado_en: sucursales.actualizado_en,
  actualizado_por: sucursales.actualizado_por ?? undefined,
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
      funct: () => handlers.onEdit(sucursales),
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
      funct: () => handlers.onDelete(sucursales),
    },
    {
      content: `
        <button class="btn-action btn-impuestos" title="Impuestos">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="9" r="2"/>
            <circle cx="15" cy="15" r="2"/>
            <path d="M3 21L21 3"/>
          </svg>
          <span>Impuestos</span>
        </button>
      `,
      event: 'click',
      funct: () => handlers.onImpuestos(sucursales),
    },
  ],
});

export const toSucursalesGridRows = (sucursales: Sucursales[], handlers: SucursalesHandlers): SucursalesGridRow[] =>
  sucursales.map((sucursales) => toSucursalesGridRow(sucursales, handlers));
