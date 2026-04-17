import type { Uploads } from '../uploads.types';

export function buildDeleteBody(item: Uploads): HTMLElement {
  const wrapper = document.createElement('div');

  const question = document.createElement('p');
  question.style.marginBottom = '16px';
  question.textContent = '¿Estás seguro que deseas eliminar el siguiente uploads?';

  const card = document.createElement('div');
  card.style.cssText = 'padding:16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca';

  const primary = document.createElement('strong');
  primary.textContent = String(item.0 ?? item.id);

  card.appendChild(primary);


  const warning = document.createElement('p');
  warning.style.cssText = 'margin-top:16px;color:#ef4444;font-size:14px;margin-bottom:0';
  warning.textContent = 'Esta acción no se puede deshacer.';

  wrapper.appendChild(question);
  wrapper.appendChild(card);
  wrapper.appendChild(warning);

  return wrapper;
}
