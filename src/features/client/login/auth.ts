import { doLogin } from './doLogin';
import { navigateTo } from '@/global/saveRoutes.js';
import { getDefaultRoute } from '@/global/guards_auth';
import { isLoggedIn } from '@/global/session.service';

// Si ya hay sesión activa, redirigir a la ruta correspondiente
if (isLoggedIn()) {
  location.replace(getDefaultRoute());
}

// ---- Toggle password visibility ----
(window as any).togglePassword = function (): void {
  const input = document.getElementById('password') as HTMLInputElement;
  const icon = document.getElementById('eyeIcon') as HTMLElement;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
};

// ---- Focus effects on inputs ----
document.querySelectorAll<HTMLInputElement>('.input-wrapper input').forEach((input) => {
  input.addEventListener('focus', () => input.closest('.input-wrapper')?.classList.add('focused'));
  input.addEventListener('blur', () => input.closest('.input-wrapper')?.classList.remove('focused'));
});

// ---- Form submission ----
(document.getElementById('loginForm') as HTMLFormElement).addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();

  const username = (document.getElementById('username') as HTMLInputElement).value.trim();
  const pin = (document.getElementById('password') as HTMLInputElement).value;
  const errorSpan = document.querySelector('.login_error') as HTMLElement;
  const btn = document.querySelector('.login-btn') as HTMLButtonElement;

  errorSpan.textContent = '';
  (document.getElementById('username') as HTMLInputElement).classList.remove('input_error');
  (document.getElementById('password') as HTMLInputElement).classList.remove('input_error');

  btn.classList.add('loading');
  (btn.querySelector('.btn-text') as HTMLElement).textContent = 'Iniciando sesión...';

  const result = await doLogin({ username, pin });

  btn.classList.remove('loading');
  (btn.querySelector('.btn-text') as HTMLElement).textContent = 'Iniciar Sesión';

  if (result.success) {
    if (result.redirect === 'lobby') {
      navigateTo('/lobby');
    } else {
      navigateTo(getDefaultRoute());
    }
  } else {
    errorSpan.textContent = result.message ?? 'Usuario o contraseña incorrectos';
    (document.getElementById('username') as HTMLInputElement).classList.add('input_error');
    (document.getElementById('password') as HTMLInputElement).classList.add('input_error');
  }
});
