import { saveSession, saveSelectedRole } from '@/global/session.service';
import { SERVER_ROUTE } from '@/config';

interface LoginPayload {
  username: string;
  pin: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
  redirect?: 'lobby' | 'default';
}

export async function doLogin(data: LoginPayload): Promise<LoginResult> {
  const response = await fetch(`${SERVER_ROUTE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || result.message || result.error) {
    return { success: false, message: result.message || 'Error al iniciar sesión' };
  }

  saveSession(result);

  const roles = result.user?.roles ?? [];

  if (roles.length > 1) {
    return { success: true, redirect: 'lobby' };
  }

  if (roles.length === 1) {
    saveSelectedRole(roles[0]);
  }

  return { success: true, redirect: 'default' };
}
