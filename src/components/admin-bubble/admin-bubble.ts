import './admin-bubble.css';
import { isSuperAdmin } from '@/global/session.service';
import { route } from '@/global/saveRoutes';

const STORAGE_KEY = 'serval_bubble_pos';
const SENTINEL   = 'adminBubbleMounted';

const NAV_ITEMS = [
  { label: 'POS — Mesas',   icon: 'fa-solid fa-table',        path: '/pos/mesas' },
  { label: 'Caja',          icon: 'fa-solid fa-cash-register', path: '/pos/caja' },
  { label: 'Cocina',        icon: 'fa-solid fa-fire-burner',   path: '/pos/cocina' },
  { label: 'Barra',         icon: 'fa-solid fa-martini-glass', path: '/pos/barra' },
  null, // separator
  { label: 'Backoffice',    icon: 'fa-solid fa-gauge',         path: '/dashboard' },
];

export function initAdminBubble(): void {
  if (!isSuperAdmin()) return;
  if (document.body.dataset[SENTINEL]) return;
  document.body.dataset[SENTINEL] = '1';

  const bubble = document.createElement('div');
  bubble.className = 'admin-bubble';
  bubble.setAttribute('aria-label', 'Navegación rápida admin');
  bubble.innerHTML = `<i class="fa-solid fa-grip admin-bubble__icon"></i>`;

  // ── Restore saved position ──────────────────────────────
  const saved = _loadPos();
  if (saved) {
    bubble.style.left = saved.x + 'px';
    bubble.style.top  = saved.y + 'px';
  } else {
    bubble.style.right  = '20px';
    bubble.style.bottom = '20px';
  }

  document.body.appendChild(bubble);

  // ── Drag logic ──────────────────────────────────────────
  let dragging = false;
  let startX = 0, startY = 0, origX = 0, origY = 0;

  bubble.addEventListener('pointerdown', (e) => {
    dragging = false;
    startX   = e.clientX;
    startY   = e.clientY;
    const rect = bubble.getBoundingClientRect();
    origX    = rect.left;
    origY    = rect.top;
    bubble.setPointerCapture(e.pointerId);
  });

  bubble.addEventListener('pointermove', (e) => {
    if (!bubble.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging && Math.abs(dx) + Math.abs(dy) < 5) return;
    dragging = true;
    _closeMenu(bubble);

    const newX = Math.max(0, Math.min(window.innerWidth  - 52, origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 52, origY + dy));

    bubble.style.left   = newX + 'px';
    bubble.style.top    = newY + 'px';
    bubble.style.right  = 'auto';
    bubble.style.bottom = 'auto';
    _savePos(newX, newY);
  });

  bubble.addEventListener('pointerup', (e) => {
    bubble.releasePointerCapture(e.pointerId);
    e.stopPropagation();
    if (!dragging) _toggleMenu(bubble);
    dragging = false;
  });

  bubble.addEventListener('pointercancel', (e) => {
    bubble.releasePointerCapture(e.pointerId);
    dragging = false;
  });

  // ── Close menu on outside click ─────────────────────────
  document.addEventListener('pointerdown', (e) => {
    if (!bubble.contains(e.target as Node)) _closeMenu(bubble);
  });
}

// ── Menu ────────────────────────────────────────────────────────────────────

function _toggleMenu(bubble: HTMLElement): void {
  const existing = bubble.querySelector('.admin-bubble__menu');
  if (existing) { _closeMenu(bubble); return; }

  bubble.classList.add('bubble--open');
  const menu = document.createElement('div');
  menu.className = 'admin-bubble__menu';

  for (const item of NAV_ITEMS) {
    if (item === null) {
      const sep = document.createElement('div');
      sep.className = 'admin-bubble__separator';
      menu.appendChild(sep);
      continue;
    }
    const btn = document.createElement('button');
    btn.className = 'admin-bubble__item';
    btn.innerHTML = `<i class="${item.icon}"></i>${item.label}`;
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('pointerup',   (e) => e.stopPropagation());
    btn.addEventListener('click', () => { location.href = route(item.path); });
    menu.appendChild(btn);
  }

  bubble.appendChild(menu);
}

function _closeMenu(bubble: HTMLElement): void {
  bubble.classList.remove('bubble--open');
  bubble.querySelector('.admin-bubble__menu')?.remove();
}

// ── Persistence ──────────────────────────────────────────────────────────────

function _savePos(x: number, y: number): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y })); } catch { /**/ }
}

function _loadPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
