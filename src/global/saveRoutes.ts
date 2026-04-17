const BASE_PATH: string = import.meta.env.BASE_URL;

export function route(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanBasePath = BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/$/, '');
  return `${cleanBasePath}${normalizedPath}`;
}

export function fullUrl(path: string): string {
  return `${window.location.origin}${route(path)}`;
}

export function navigateTo(path: string): void {
  window.location.href = route(path);
}

export function isCurrentRoute(path: string): boolean {
  return window.location.pathname === route(path);
}
