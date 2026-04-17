import { initMenu } from '@/components/menu/menu';
import { initTopbar } from '@/components/topbar/topbar';
import { ArticuloImpuestos } from './ArticuloImpuestos';

// ---- Inicializar menú y topbar ----
document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initTopbar();
});

// ---- Mount feature ----
const container = document.createElement('div');
container.style.cssText = 'max-width:1200px;margin:0 auto;padding:24px 16px 48px';
document.getElementById('app')!.appendChild(container);

ArticuloImpuestos(container);
