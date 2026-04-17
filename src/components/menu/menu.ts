// ===== MENÚ LATERAL RESPONSIVO =====

import './menu.css';
import type { MenuItem, MenuConfig } from './menu.types';
import { ADMIN_OPTIONS } from './menu_options/admin_options';
import { checkIfLogin, isBackofficeRole, getDefaultRoute } from '@/global/guards_auth';
import { clearSession, getUser, getSelectedRole } from '@/global/session.service';

// ---- Utilidades inline ----

function doLogout(): void {
  clearSession();
  window.location.href = '/';
}

function getUserData(): { username: string; avatar: string; rol: string } {
  const user = getUser();
  const role = getSelectedRole();
  if (user) {
    return {
      username: user.username ?? user.nombre ?? 'Usuario',
      avatar: '',
      rol: role?.nombre ?? 'Usuario',
    };
  }
  return { username: 'Usuario', avatar: '', rol: 'Usuario' };
}

// ---- Configuración del menú ----

const { username, avatar, rol } = getUserData();
const sessionUser    = getUser();
const hasMultipleRoles = (sessionUser?.roles?.length ?? 0) > 1;

const MENU_CONFIG: MenuConfig = {
  header: {
    title: 'Sistema de Gestión',
    subtitle: 'Panel de Administración',
  },
  mainItems: ADMIN_OPTIONS,
  profileItem: {
    id: 'profile',
    name: username,
    rol: rol.toUpperCase(),
    avatar: avatar || username.charAt(0).toUpperCase(),
    href: '/mi-perfil',
  },
  bottomItems: [
    ...(hasMultipleRoles ? [{
      id: 'switch-role',
      icon: 'fas fa-exchange-alt',
      text: 'Cambiar Rol',
      href: '/lobby',
    }] : []),
    {
      id: 'logout',
      icon: 'fas fa-sign-out-alt',
      text: 'Cerrar Sesión',
      href: '#',
      onclick: doLogout,
    },
  ],
};

// ---- Comportamiento de submenús ----

const ALLOW_MULTIPLE_SUBMENUS  = true;  // true: permite abrir más de uno a la vez
const MAX_OPEN_SUBMENUS        = 3;     // máximo de submenús abiertos simultáneamente (solo aplica si ALLOW_MULTIPLE_SUBMENUS = true)
const COMPACT_HOVER_DELAY_MS   = 1000; // ms antes de expandir el sidebar compactado al hacer hover

// ---- Clase del sidebar ----

export class ResponsiveSidebar {
  private menuToggle!: HTMLElement;
  private menuSide!: HTMLElement;
  private bodySide!: HTMLElement;
  private overlay!: HTMLElement;
  private isMenuOpen          = false;
  private isCompact           = false;
  private compactHoverTimeout: number | null = null;
  private prevBreakpoint: 'desktop' | 'tablet' | 'mobile';
  private readonly currentPath: string;
  private readonly currentFullPath: string;

  constructor() {
    this.currentPath = window.location.pathname;
    this.currentFullPath = window.location.pathname + window.location.search;
    const w = window.innerWidth;
    this.prevBreakpoint = w >= 1200 ? 'desktop' : w > 768 ? 'tablet' : 'mobile';

    this.injectMenuControls();

    this.menuToggle = document.getElementById('menuToggle') as HTMLElement;
    this.menuSide   = document.getElementById('menuSide')   as HTMLElement;
    this.bodySide   = document.getElementById('bodySide')   as HTMLElement;
    this.overlay    = document.getElementById('overlay')    as HTMLElement;

    this.setActiveMenuItem();
    this.init();
  }

  private injectMenuControls(): void {
    const bodySide = document.getElementById('bodySide');
    if (!bodySide) {
      console.error('No se encontró el elemento #bodySide');
      return;
    }

    const controls = document.createElement('div');
    controls.innerHTML = `
      <button class="menu_toggle" id="menuToggle">
        <i class="fas fa-bars"></i>
      </button>
      <div class="overlay" id="overlay"></div>
    `;

    document.body.insertBefore(controls, document.body.firstChild);
  }

  private setActiveMenuItem(): void {
    MENU_CONFIG.mainItems.forEach(item => {
      item.active = false;
      item.submenu?.forEach(sub => { sub.active = false; });
    });
    MENU_CONFIG.profileItem.active = false;

    const profileHref = MENU_CONFIG.profileItem.href;
    if (profileHref && (this.currentPath === profileHref || (profileHref !== '#' && this.currentPath.startsWith(profileHref)))) {
      MENU_CONFIG.profileItem.active = true;
      return;
    }

    // Coincidencia exacta
    MENU_CONFIG.mainItems.forEach(item => {
      if (item.href && item.href !== '#') {
        if (this.currentFullPath === item.href || this.currentPath === item.href) {
          item.active = true;
        }
      }
      item.submenu?.forEach(sub => {
        if (sub.href && sub.href !== '#') {
          if (this.currentFullPath === sub.href || this.currentPath === sub.href) {
            sub.active = true;
            item.active = true;
          }
        }
      });
    });

    // Coincidencia parcial si no hay exacta
    const hasActive = MENU_CONFIG.mainItems.some(i => i.active);
    if (!hasActive) {
      MENU_CONFIG.mainItems.forEach(item => {
        if (item.href && item.href !== '#') {
          if (this.currentFullPath.startsWith(item.href) || this.currentPath.startsWith(item.href)) {
            item.active = true;
          }
        }
        item.submenu?.forEach(sub => {
          if (sub.href && sub.href !== '#') {
            if (this.currentFullPath.startsWith(sub.href) || this.currentPath.startsWith(sub.href)) {
              sub.active = true;
              item.active = true;
            }
          }
        });
      });
    }
  }

  private init(): void {
    this.bodySide.style.transition = 'none';
    this.menuSide.style.transition = 'none';

    this.generateMenu();

    this.menuToggle.addEventListener('click', () => this.toggleMenu());
    this.overlay.addEventListener('click',    () => this.closeMenu());
    window.addEventListener('resize',         () => this.updateLayout());
    this.menuSide.addEventListener('transitionend', () => this.updateLayout());

    this.updateLayout();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.bodySide.style.transition = '';
        this.menuSide.style.transition = '';
      });
    });
  }

  private generateMenu(): void {
    this.menuSide.innerHTML = `
      <div class="menu_header">
        <div class="menu_header_content">
          <h2>${MENU_CONFIG.header.title}</h2>
          <p>${MENU_CONFIG.header.subtitle}</p>
        </div>
        <button class="menu_close_btn" id="menuCloseBtn" title="Cerrar menú">
          <i class="fas fa-times"></i>
        </button>
        <button class="menu_compact_btn" id="menuCompactBtn" title="Compactar menú">
          <i class="fas fa-chevron-left"></i>
        </button>
      </div>
      <div class="menu_items">
        <div class="menu_main_items">
          ${this.generateMenuItems(MENU_CONFIG.mainItems)}
        </div>
        <div class="menu_profile_section">
          ${this.generateProfileSection()}
        </div>
        <div class="menu_bottom_items">
          ${this.generateMenuItems(MENU_CONFIG.bottomItems)}
        </div>
      </div>
    `;

    this.setupSubmenuListeners();
    this.setupOnclickListeners();
    this.expandActiveSubmenu();
    this.setupCompactListener();
  }

  private setupCompactListener(): void {
    document.getElementById('menuCompactBtn')?.addEventListener('click', () => this.toggleCompact());
    document.getElementById('menuCloseBtn')?.addEventListener('click', () => this.closeMenu());

    this.menuSide.addEventListener('mouseenter', () => {
      if (!this.isCompact) return;
      this.compactHoverTimeout = window.setTimeout(() => {
        this.menuSide.classList.add('compact-expanded');
      }, COMPACT_HOVER_DELAY_MS);
    });

    this.menuSide.addEventListener('mouseleave', () => {
      if (this.compactHoverTimeout !== null) {
        clearTimeout(this.compactHoverTimeout);
        this.compactHoverTimeout = null;
      }
      this.menuSide.classList.remove('compact-expanded');
    });

  }

  private toggleCompact(): void {
    this.isCompact = !this.isCompact;
    this.menuSide.classList.toggle('compact', this.isCompact);

    const icon = document.querySelector('#menuCompactBtn i');
    if (icon) {
      icon.className = this.isCompact ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    }

    const btn = document.getElementById('menuCompactBtn');
    if (btn) btn.title = this.isCompact ? 'Expandir menú' : 'Compactar menú';

    if (this.isCompact) {
      // Cerrar submenús abiertos al compactar
      document.querySelectorAll<HTMLElement>('.submenu.active').forEach(s => {
        s.classList.remove('active');
        const ch = document.querySelector(`[data-submenu="${s.id}"] .fa-chevron-down`) as HTMLElement | null;
        if (ch) ch.style.transform = 'rotate(0deg)';
      });
    } else {
      this.menuSide.classList.remove('compact-expanded');
    }

    this.updateLayout();
  }

  private generateProfileSection(): string {
    const p = MENU_CONFIG.profileItem;
    const isImage = p.avatar.startsWith('http') || p.avatar.startsWith('/');
    const activeClass = p.active ? 'active' : '';

    return `
      <a href="${p.href}" class="menu_profile_item ${activeClass}">
        <div class="profile_avatar">
          ${isImage
            ? `<img src="${p.avatar}" alt="${p.name}">`
            : `<span class="avatar_initial">${p.avatar}</span>`
          }
        </div>
        <div class="cont_profile_name_rol">
          <span class="profile_name">${p.rol}</span>
          <span class="profile_name">${p.name}</span>
        </div>
        <i class="fas fa-chevron-right profile_arrow"></i>
      </a>
    `;
  }

  private generateMenuItems(items: MenuItem[]): string {
    return items.map(item => {
      const hasSubmenu = (item.submenu?.length ?? 0) > 0;
      const hasActiveSubitem = hasSubmenu && item.submenu!.some(s => s.active);
      const activeClass = (item.active || hasActiveSubitem) ? 'active' : '';
      const dataOnclick = item.onclick ? `data-item-id="${item.id}"` : '';
      const dataSubmenu = hasSubmenu ? `data-submenu="${item.id}"` : '';

      let html = `
        <a href="${item.href ?? '#'}" class="menu_item ${activeClass}" ${dataOnclick} ${dataSubmenu}>
          <i class="${item.icon}"></i>
          <span>${item.text}</span>
          ${hasSubmenu ? '<i class="fas fa-chevron-down" style="margin-left:auto;transition:transform 0.3s;"></i>' : ''}
        </a>
      `;

      if (hasSubmenu) {
        html += `
          <div class="submenu" id="${item.id}">
            ${item.submenu!.map(sub => {
              const subActive = sub.active ? 'active' : '';
              return `<a href="${sub.href}" class="submenu_item ${subActive}">${sub.text}</a>`;
            }).join('')}
          </div>
        `;
      }

      return html;
    }).join('');
  }

  private setupOnclickListeners(): void {
    [...MENU_CONFIG.mainItems, ...MENU_CONFIG.bottomItems].forEach(item => {
      if (!item.onclick) return;
      const el = document.querySelector(`[data-item-id="${item.id}"]`);
      el?.addEventListener('click', (e) => {
        e.preventDefault();
        item.onclick!();
      });
    });
  }

  private expandActiveSubmenu(): void {
    MENU_CONFIG.mainItems.forEach(item => {
      if (!item.submenu?.length) return;
      const hasActiveSubitem = item.submenu.some(s => s.active);
      if (!item.active && !hasActiveSubitem) return;

      const submenuEl = document.getElementById(item.id);
      const menuItemEl = document.querySelector(`[data-submenu="${item.id}"]`);
      const chevron = menuItemEl?.querySelector('.fa-chevron-down') as HTMLElement | null;

      submenuEl?.classList.add('active');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    });
  }

  private setupSubmenuListeners(): void {
    document.querySelectorAll('[data-submenu]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleSubmenu(item as HTMLElement);
      });
    });
  }

  private toggleMenu(): void {
    this.isMenuOpen ? this.closeMenu() : this.openMenu();
  }

  private openMenu(): void {
    this.isMenuOpen = true;
    this.menuSide.classList.add('active');
    this.menuToggle.innerHTML = '<i class="fas fa-times"></i>';
    this.updateLayout();
  }

  private closeMenu(): void {
    this.isMenuOpen = false;
    this.menuSide.classList.remove('active');
    this.menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    this.updateLayout();
  }

  private toggleSubmenu(menuItem: HTMLElement): void {
    const submenuId = menuItem.dataset['submenu']!;
    const submenu = document.getElementById(submenuId);
    const chevron = menuItem.querySelector('.fa-chevron-down') as HTMLElement | null;

    if (!submenu) return;

    if (submenu.classList.contains('active')) {
      submenu.classList.remove('active');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    } else {
      if (!ALLOW_MULTIPLE_SUBMENUS) {
        document.querySelectorAll<HTMLElement>('.submenu.active').forEach(s => {
          s.classList.remove('active');
          const ch = document.querySelector(`[data-submenu="${s.id}"] .fa-chevron-down`) as HTMLElement | null;
          if (ch) ch.style.transform = 'rotate(0deg)';
        });
      } else {
        const openSubmenus = document.querySelectorAll<HTMLElement>('.submenu.active');
        if (openSubmenus.length >= MAX_OPEN_SUBMENUS) {
          const oldest = openSubmenus[0];
          oldest.classList.remove('active');
          const ch = document.querySelector(`[data-submenu="${oldest.id}"] .fa-chevron-down`) as HTMLElement | null;
          if (ch) ch.style.transform = 'rotate(0deg)';
        }
      }
      submenu.classList.add('active');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
  }

  updateLayout(): void {
    const w = window.innerWidth;
    const menuWidth = 280;
    const breakpoint: 'desktop' | 'tablet' | 'mobile' =
      w >= 1200 ? 'desktop' : w > 768 ? 'tablet' : 'mobile';

    // Auto-cerrar al salir de desktop
    if (this.prevBreakpoint === 'desktop' && breakpoint !== 'desktop') {
      this.isMenuOpen = false;
      this.menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
      this.menuSide.classList.remove('compact-expanded');
    }
    this.prevBreakpoint = breakpoint;

    if (breakpoint === 'desktop') {
      this.showMenuDesktop(menuWidth);
    } else if (breakpoint === 'tablet') {
      this.handleTabletMode(menuWidth);
    } else {
      this.handleMobileMode();
    }

    this.bodySide.style.transform = 'translateZ(0)';
  }

  private showMenuDesktop(menuWidth: number): void {
    this.menuSide.classList.toggle('compact', this.isCompact);
    const effectiveWidth = this.isCompact ? 64 : menuWidth;
    this.menuSide.style.transform = 'translateX(0)';
    this.menuSide.classList.add('active');
    this.bodySide.style.left  = `${effectiveWidth}px`;
    this.bodySide.style.width = `calc(100% - ${effectiveWidth}px)`;
    this.bodySide.style.paddingTop = '20px';
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
    this.isMenuOpen = true;
  }

  private handleTabletMode(menuWidth: number): void {
    this.menuSide.classList.remove('compact');
    if (this.isMenuOpen) {
      this.menuSide.style.transform = 'translateX(0)';
      this.bodySide.style.left  = `${menuWidth}px`;
      this.bodySide.style.width = `calc(100% - ${menuWidth}px)`;
    } else {
      this.menuSide.style.transform = 'translateX(-100%)';
      this.bodySide.style.left  = '0';
      this.bodySide.style.width = '100%';
    }
    this.bodySide.style.paddingTop = '80px';
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  private handleMobileMode(): void {
    this.menuSide.classList.remove('compact');
    if (this.isMenuOpen) {
      this.menuSide.style.transform = 'translateX(0)';
      this.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      this.menuSide.style.transform = 'translateX(-100%)';
      this.overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    this.bodySide.style.left  = '0';
    this.bodySide.style.width = '100%';
    this.bodySide.style.paddingTop = '70px';
  }
}

// ---- Inicializar ----

export function initMenu(): ResponsiveSidebar {
  if (!checkIfLogin() || !isBackofficeRole()) {
    location.replace(getDefaultRoute());
    return null as unknown as ResponsiveSidebar;
  }

  const sidebar = new ResponsiveSidebar();

  window.addEventListener('load', () => sidebar.updateLayout());
  window.addEventListener('orientationchange', () => {
    setTimeout(() => sidebar.updateLayout(), 100);
  });

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  return sidebar;
}
