export function fmt(num: number): string {
  return '$' + Number(num).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function tiempoStr(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const segs = Math.floor((ms % 60000) / 1000);
  return String(mins).padStart(2, '0') + ':' + String(segs).padStart(2, '0');
}

export function tiempoDesde(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return '< 1 min';
  return mins + ' min';
}

export function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}
