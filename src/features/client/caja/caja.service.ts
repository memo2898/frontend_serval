import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { TicketCola, PagoAplicado } from './caja.types';
import { CAJA_QUEUE_KEY } from '../shared/services/pos-channel';

const BASE = `${SERVER_ROUTE}/api`;

// ─── Cola local (localStorage) ────────────────────────────────────────────────

export function getQueue(): TicketCola[] {
  try {
    return JSON.parse(localStorage.getItem(CAJA_QUEUE_KEY) ?? '[]') as TicketCola[];
  } catch {
    return [];
  }
}

export function removeFromQueue(mesaId: number): void {
  const queue = getQueue().filter(t => t.mesaId !== mesaId);
  localStorage.setItem(CAJA_QUEUE_KEY, JSON.stringify(queue));
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const confirmarCobro = (ordenId: number, pagos: PagoAplicado[]) =>
  http.post(`${BASE}/ordenes/${ordenId}/cobrar`, { pagos });

export const getFormasPago = () =>
  http.get<Array<{ id: number; nombre: string; icono: string }>>(`${BASE}/formaspago`);
