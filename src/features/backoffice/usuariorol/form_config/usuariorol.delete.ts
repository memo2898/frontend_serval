import type { UsuarioRol } from '../usuariorol.types';

export function buildDeleteBody(item: UsuarioRol): HTMLElement {
  const wrapper = document.createElement('div');

  const question = document.createElement('p');
  question.style.marginBottom = '16px';
  question.textContent = '¿Estás seguro que deseas eliminar el siguiente usuariorol?';

  const card = document.createElement('div');
  card.style.cssText = 'padding:16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca';

  const primary = document.createElement('strong');
  primary.textContent = String(item.usuario_id ?? item.id);

  card.appendChild(primary);

  const secondary = document.createElement('span');
  secondary.style.cssText = 'display:block;color:#6b7280;font-size:14px;margin-top:4px';
  secondary.textContent = String(item.rol_id ?? '');

  card.appendChild(secondary);

  const warning = document.createElement('p');
  warning.style.cssText = 'margin-top:16px;color:#ef4444;font-size:14px;margin-bottom:0';
  warning.textContent = 'Esta acción no se puede deshacer.';

  wrapper.appendChild(question);
  wrapper.appendChild(card);
  wrapper.appendChild(warning);

  return wrapper;
}
