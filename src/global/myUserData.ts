import { getSession, updateUser } from './session.service';

export function getGlobalUserData() {
  return { data: getSession() };
}

export function changeFalseCambiarPass() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUser({ debe_cambiar_password: false } as any);
}
