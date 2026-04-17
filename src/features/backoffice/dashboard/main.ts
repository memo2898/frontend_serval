import { initMenu } from '@/components/menu/menu';
import { initTopbar } from '@/components/topbar/topbar';
import { checkIfLogin } from '@/global/guards_auth';
import { Dashboard } from './Dashboard';

document.addEventListener('DOMContentLoaded', () => {
  if (!checkIfLogin()) return;
  initMenu();
  initTopbar();
});

const container = document.createElement('div');
document.getElementById('app')!.appendChild(container);

Dashboard(container);
