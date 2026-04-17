import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { Comanda, KdsConfig } from './kds.types';

// ─── Tipos de respuesta del backend ──────────────────────────────────────────

interface KdsLineaApi {
  id: number;
  articulo_nombre: string;
  cantidad: number;
  modificadores: string;
  notas_linea: string | null;
  estado: string;
}

interface KdsComandaApi {
  id: number;
  tipo_servicio: string;
  estado: string;
  mesa_nombre: string | null;
  tiempo_recibido: string;
  lineas: KdsLineaApi[];
}

// ─── Mapeador ─────────────────────────────────────────────────────────────────

function mapComanda(c: KdsComandaApi): Comanda {
  return {
    id:     String(c.id),
    numero: '#' + String(c.id).padStart(4, '0'),
    mesa:   c.mesa_nombre ?? '—',
    tipo:   c.tipo_servicio as Comanda['tipo'],
    estado: c.estado as Comanda['estado'],
    abierta: new Date(c.tiempo_recibido).getTime(),
    lineas: c.lineas.map(l => ({
      id:     l.id,
      nombre: l.articulo_nombre,
      qty:    l.cantidad,
      mods:   l.modificadores ?? '',
      nota:   l.notas_linea ?? '',
      done:   l.estado === 'lista',
    })),
  };
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

const BASE = `${SERVER_ROUTE}/api/kds`;

export async function fetchComandas(config: KdsConfig): Promise<Comanda[]> {
  const data = await http.get<KdsComandaApi[]>(`${BASE}?destino_id=${config.destinoId}`);
  return data.map(mapComanda);
}

export async function patchEstadoComanda(id: string, estado: string): Promise<void> {
  await http.patch(`${BASE}/${id}/estado`, { estado });
}

export async function patchEstadoLinea(id: string, lineaId: number, done: boolean): Promise<void> {
  await http.patch(`${BASE}/${id}/lineas/${lineaId}`, { done });
}
