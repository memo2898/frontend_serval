import { EncryptedStorage } from './encrypt';
import type { LoginResponse, LoginUser, LoginUserRole } from '@/features/backoffice/auth/auth.types';

const STORAGE_KEY = 'servalUserData';
const SELECTED_ROLE_KEY = 'servalSelectedRole';
const storage = new EncryptedStorage();

// ── Lectura ──────────────────────────────────────────────

export function getSession(): LoginResponse | null {
  const result = storage.read(STORAGE_KEY);
  if (!result.success || !result.data) return null;
  return result.data as LoginResponse;
}

export function getToken(): string | null {
  return getSession()?.access_token ?? null;
}

export function getUser(): LoginUser | null {
  return getSession()?.user ?? null;
}

// ── Rol seleccionado ──────────────────────────────────────

export function getSelectedRole(): LoginUserRole | null {
  try {
    const raw = localStorage.getItem(SELECTED_ROLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSelectedRole(role: LoginUserRole): void {
  localStorage.setItem(SELECTED_ROLE_KEY, JSON.stringify(role));
}

export function clearSelectedRole(): void {
  localStorage.removeItem(SELECTED_ROLE_KEY);
}

// ── Estado ───────────────────────────────────────────────

export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

export function isTokenExpired(token?: string): boolean {
  const t = token ?? getToken();
  if (!t) return true;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload.exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

export function hasPermission(_permiso: string): boolean {
  return isSuperAdmin();
}

export function isSuperAdmin(): boolean {
  const role = getSelectedRole();
  if (!role) return false;
  return role.nombre?.toLowerCase() === 'administrador';
}

export function mustChangePassword(): boolean {
  return false;
}

// ── Escritura ─────────────────────────────────────────────

export function saveSession(data: LoginResponse): void {
  storage.create(STORAGE_KEY, data);
  clearContext();
  clearSelectedRole();
}

export function updateUser(partial: Partial<LoginUser>): boolean {
  const session = getSession();
  if (!session) return false;
  const updated: LoginResponse = {
    ...session,
    user: { ...session.user, ...partial },
  };
  return storage.update(STORAGE_KEY, updated).success;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  clearSelectedRole();
  clearContext();
}

// ── Contexto de lobby (sucursal + rol seleccionado) ──────

const CONTEXT_KEY = 'lobbyCtx';

export interface LobbyContext {
  sucursal_id: number;
  nombre_sucursal: string;
  id_rol: number | null;
  nombre_rol: string;
}

export function saveContext(ctx: LobbyContext): void {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
}

export function getContext(): LobbyContext | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Devuelve el sucursal_id guardado en el contexto del lobby.
 * Retorna 0 si no hay contexto o si el contexto guardado tiene el
 * formato antiguo (campo id_parque en lugar de sucursal_id).
 */
export function getSucursalId(): number {
  const ctx = getContext();
  // Detectar contexto con formato viejo y limpiarlo
  if (ctx && !('sucursal_id' in ctx)) {
    clearContext();
    return 0;
  }
  return ctx?.sucursal_id ?? 0;
}

export function clearContext(): void {
  localStorage.removeItem(CONTEXT_KEY);
}
