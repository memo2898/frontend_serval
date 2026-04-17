// ===== TIPOS DEL MENÚ =====

export interface SubMenuItem {
  text: string;
  href: string;
  icon?: string;
  active?: boolean;
}

export interface MenuItem {
  id: string;
  icon: string;
  text: string;
  href?: string;
  active?: boolean;
  onclick?: () => void;
  submenu?: SubMenuItem[];
  badge?: number;
}

export interface MenuHeader {
  title: string;
  subtitle: string;
}

export interface MenuProfileItem {
  id: string;
  name: string;
  rol: string;
  avatar: string;
  href: string;
  active?: boolean;
}

export interface MenuConfig {
  header: MenuHeader;
  mainItems: MenuItem[];
  profileItem: MenuProfileItem;
  bottomItems: MenuItem[];
}
