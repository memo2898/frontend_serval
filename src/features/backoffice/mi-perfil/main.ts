import { initMenu } from '@/components/menu/menu';
import { initTopbar } from '@/components/topbar/topbar';
import { MiPerfil } from './mi-perfil';

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initTopbar();
});

const container = document.createElement('div');
container.style.cssText = 'max-width:800px;margin:0 auto;padding:24px 16px 48px';
document.getElementById('app')!.appendChild(container);

MiPerfil(container);
