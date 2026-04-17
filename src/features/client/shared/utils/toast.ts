export type ToastTipo = 'info' | 'success' | 'error';

let _timer: ReturnType<typeof setTimeout> | undefined;

export function toast(msg: string, tipo: ToastTipo = 'info'): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show ' + tipo;
  clearTimeout(_timer);
  _timer = setTimeout(() => { el.className = 'toast'; }, 2800);
}
