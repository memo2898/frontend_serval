// ============================================
// MENÚ PARA ADMINISTRADOR
// ============================================
import type { MenuItem } from '../menu.types';

export const ADMIN_OPTIONS: MenuItem[] = [
  {
    id: 'dashboard',
    icon: 'fas fa-home',
    text: 'Dashboard',
    href: '/dashboard',
  },

  // ── Estructura organizativa ──────────────────
  {
    id: 'configuracion',
    icon: 'fas fa-cog',
    text: 'Configuración',
    href: '#',
    submenu: [
      { text: 'Países',               href: '/paises' },
      { text: 'Tipo Documentos',      href: '/tipodocumentos' },
      { text: 'Empresas',             href: '/empresas' },
      { text: 'Sucursales',           href: '/sucursales' },
      // { text: 'Config. Sucursal',     href: '/configuracionsucursal' },
      // { text: 'Terminales',           href: '/terminales' },
      // { text: 'Destinos Impresión',   href: '/destinosimpresion' },
    ],
  },

  // ── Seguridad y accesos ──────────────────────
  {
    id: 'seguridad',
    icon: 'fas fa-shield-alt',
    text: 'Seguridad',
    href: '#',
    submenu: [
      { text: 'Roles',        href: '/roles' },
      { text: 'Permisos',     href: '/permisos' },
      //{ text: 'Rol Permisos', href: '/rolpermiso' },
      { text: 'Usuarios',     href: '/usuarios' },
     
    ],
  },

  // ── Carta / Catálogo ─────────────────────────
  {
    id: 'catalogo',
    icon: 'fas fa-book-open',
    text: 'Catálogo',
    href: '#',
    submenu: [
      { text: 'Familias',              href: '/familias' },
      { text: 'Subfamilias',           href: '/subfamilias' },
      { text: 'Artículos',             href: '/articulos' },
      // { text: 'Artículo Impuestos',    href: '/articuloimpuestos' },
      // { text: 'Alérgenos',             href: '/alergenos' },
      // { text: 'Artículo Alérgenos',    href: '/articuloalergenos' },
    ],
  },

  // ── Modificadores ────────────────────────────
  {
    id: 'modificadores',
    icon: 'fas fa-sliders-h',
    text: 'Modificadores',
    href: '#',
    submenu: [
      { text: 'Grupos Modificadores',          href: '/gruposmodificadores' },
      { text: 'Modificadores',                 href: '/modificadores' },
      { text: 'Artículo Grupos Modificadores', href: '/articulogruposmodificadores' },
    ],
  },

  // ── Combos ──────────────────────────────────
  // {
  //   id: 'combos',
  //   icon: 'fas fa-layer-group',
  //   text: 'Combos',
  //   href: '#',
  //   submenu: [
  //     { text: 'Combos',          href: '/combos' },
  //     { text: 'Combo Artículos', href: '/comboarticulos' },
  //   ],
  // },

  // ── Precios y descuentos ─────────────────────
  {
    id: 'precios',
    icon: 'fas fa-tags',
    text: 'Precios',
    href: '#',
    submenu: [
      { text: 'Monedas',           href: '/monedas' },
      { text: 'Impuestos',        href: '/impuestos' },
      { text: 'Tarifas',          href: '/tarifas' },
      { text: 'Precios por Tarifa', href: '/preciosportarifa' },
      { text: 'Descuentos',       href: '/descuentos' },
    ],
  },

  // ── Salón ────────────────────────────────────
  {
    id: 'salon',
    icon: 'fas fa-chair',
    text: 'Salón',
    href: '#',
    submenu: [
      { text: 'Zonas',        href: '/zonas' },
      { text: 'Mesas',        href: '/mesas' },
      { text: 'Reservaciones', href: '/reservaciones' },
    ],
  },

  // ── Clientes ─────────────────────────────────
  {
    id: 'clientes',
    icon: 'fas fa-users',
    text: 'Clientes',
    href: '#',
    submenu: [
      { text: 'Clientes',      href: '/clientes' },
      { text: 'Formas de Pago', href: '/formaspago' },
    ],
  },

  // ── Caja ─────────────────────────────────────
  {
    id: 'caja',
    icon: 'fas fa-cash-register',
    text: 'Caja',
    href: '#',
    submenu: [
      { text: 'Turnos de Caja',      href: '/turnoscaja' },
      { text: 'Movimientos de Caja', href: '/movimientoscaja' },
    ],
  },

  // ── Órdenes ──────────────────────────────────
  {
    id: 'ordenes',
    icon: 'fas fa-receipt',
    text: 'Órdenes',
    href: '#',
    submenu: [
      { text: 'Órdenes',                   href: '/ordenes' },
      { text: 'Líneas de Orden',           href: '/ordenlineas' },
      { text: 'Modificadores de Línea',    href: '/ordenlineamodificadores' },
      { text: 'Pagos de Orden',            href: '/ordenpagos' },
    ],
  },

  // ── Facturación ──────────────────────────────
  {
    id: 'facturacion',
    icon: 'fas fa-file-invoice-dollar',
    text: 'Facturación',
    href: '#',
    submenu: [
      { text: 'Facturas', href: '/facturas' },
    ],
  },

  // ── Cocina / KDS ─────────────────────────────
  {
    id: 'cocina',
    icon: 'fas fa-utensils',
    text: 'Cocina',
    href: '#',
    submenu: [
      { text: 'KDS Órdenes', href: '/kdsordenes' },
    ],
  },

  // ── Inventario ───────────────────────────────
  {
    id: 'inventario',
    icon: 'fas fa-boxes',
    text: 'Inventario',
    href: '#',
    submenu: [
      { text: 'Stock',               href: '/stock' },
      { text: 'Movimientos de Stock', href: '/movimientosstock' },
    ],
  },


];
