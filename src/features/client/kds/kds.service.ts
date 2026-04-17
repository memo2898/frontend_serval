import { http } from '@/http';
import { SERVER_ROUTE } from '@/config';
import type { Comanda, KdsConfig } from './kds.types';

const BASE = `${SERVER_ROUTE}/api`;

interface PantallaLinea {
  kds_orden_id: number;
  orden_linea_id: number;
  articulo: string;
  cantidad: number;
  modificadores: string[];
  notas_linea: string;
  tiempo_preparacion: number | null;
  estado: string;
}

interface PantallaComanda {
  kds_orden_id: number;
  orden_id: number;
  numero_orden: number;
  mesa: string;
  tipo_servicio: string;
  tiempo_recibido: string;
  estado: string;
  lineas: PantallaLinea[];
}

function mapComanda(c: PantallaComanda): Comanda {
  return {
    kds_orden_id: c.kds_orden_id,
    orden_id:     c.orden_id,
    numero:       '#' + String(c.numero_orden).padStart(4, '0'),
    mesa:         c.mesa ?? '—',
    tipo:         c.tipo_servicio as Comanda['tipo'],
    estado:       c.estado as Comanda['estado'],
    abierta:      new Date(c.tiempo_recibido).getTime(),
    lineas: c.lineas.map(l => ({
      kds_orden_id:   l.kds_orden_id,
      orden_linea_id: l.orden_linea_id,
      nombre:         l.articulo,
      qty:            l.cantidad,
      mods:           Array.isArray(l.modificadores) ? l.modificadores.join(', ') : '',
      nota:           l.notas_linea ?? '',
      done:           l.estado === 'listo',
    })),
  };
}

export async function fetchComandas(config: KdsConfig): Promise<Comanda[]> {
  const data = await http.get<PantallaComanda[]>(
    `${BASE}/kds-ordenes/pantalla?destino_id=${config.destinoId}`,
  );
  return data.map(mapComanda);
}

export async function resolveDestinoId(sucursalId: number, tipo: 'cocina' | 'barra'): Promise<number | null> {
  const data = await http.get<{ id: number; tipo: string }[]>(
    `${BASE}/destinos-impresion?sucursal_id=${sucursalId}&tipo=${tipo}`,
  );
  const items = Array.isArray(data) ? data : (data as any)?.data ?? [];
  return items.find((d: any) => d.tipo === tipo)?.id ?? null;
}
