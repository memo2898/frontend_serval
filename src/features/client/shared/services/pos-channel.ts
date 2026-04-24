// ─── Tipos de mensajes entre módulos POS ───────────────────────────────────

export type PosMessageCaja =
  | { tipo: 'nueva_orden'; ticket: unknown }
  | { tipo: 'split_actualizado'; ordenId: number; splitMode: boolean; numCuentas: number; cuentasNombres: Record<number, string>; lineas: Array<{ id: number; cuenta_num: number }> }

export type PosMessageMesas =
  | { tipo: 'mesa_liberada'; mesaId: number }
  | { tipo: 'split_actualizado'; ordenId: number; splitMode: boolean; numCuentas: number; cuentasNombres: Record<number, string>; lineas: Array<{ id: number; cuenta_num: number }> }

export type PosChannelName = 'pos_caja' | 'pos_mesas';

// ─── Clase genérica ─────────────────────────────────────────────────────────

export class PosChannel<T> {
  private readonly _bc: BroadcastChannel;

  constructor(name: PosChannelName) {
    this._bc = new BroadcastChannel(name);
  }

  send(msg: T): void {
    this._bc.postMessage(msg);
  }

  on(handler: (msg: T) => void): () => void {
    const listener = (e: MessageEvent<T>) => handler(e.data);
    this._bc.addEventListener('message', listener);
    return () => this._bc.removeEventListener('message', listener);
  }

  close(): void {
    this._bc.close();
  }
}

// ─── Instancias nombradas ────────────────────────────────────────────────────

export const cajaChannel  = new PosChannel<PosMessageCaja>('pos_caja');
export const mesasChannel = new PosChannel<PosMessageMesas>('pos_mesas');

// ─── Clave de localStorage para la cola de caja ──────────────────────────────

export const CAJA_QUEUE_KEY  = 'pos_caja_queue';
export const MESAS_UPDATE_KEY = 'pos_mesa_updates';
