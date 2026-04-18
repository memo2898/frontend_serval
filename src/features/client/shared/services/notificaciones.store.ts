export interface EntregaPendiente {
  id: string;
  orden_id: number;
  mesa_id: number | null;
  mesa: string;
  usuario_id: number | null;
  articulos: { nombre: string; cantidad: number }[];
  orden_linea_ids: number[];
  timestamp: number;
}

type Listener = () => void;

const LS_KEY = 'serval_entregas_pendientes';

const _load = (): EntregaPendiente[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
};

const _save = (entregas: EntregaPendiente[]): void => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entregas)); }
  catch { /* cuota excedida — ignorar */ }
};

let _entregas: EntregaPendiente[] = _load();
const _listeners = new Set<Listener>();

const notify = () => _listeners.forEach(fn => fn());

export const notifStore = {
  agregar(e: Omit<EntregaPendiente, 'timestamp'>): void {
    if (_entregas.some(x => x.id === e.id)) return;
    _entregas = [{ ...e, timestamp: Date.now() }, ..._entregas];
    _save(_entregas);
    notify();
  },

  marcarRecibida(id: string): void {
    _entregas = _entregas.filter(e => e.id !== id);
    _save(_entregas);
    notify();
  },

  marcarPorLineas(lineaIds: number[]): void {
    const antes = _entregas.length;
    _entregas = _entregas.filter(e => !e.orden_linea_ids.some(id => lineaIds.includes(id)));
    if (_entregas.length !== antes) { _save(_entregas); notify(); }
  },

  getAll: (): EntregaPendiente[] => _entregas,

  getMias: (userId: number): EntregaPendiente[] =>
    _entregas.filter(e => e.usuario_id === userId),

  getGlobales: (userId: number): EntregaPendiente[] =>
    _entregas.filter(e => e.usuario_id !== userId),

  contar: (): number => _entregas.length,

  contarMias: (userId: number): number =>
    _entregas.filter(e => e.usuario_id === userId).length,

  contarGlobales: (userId: number): number =>
    _entregas.filter(e => e.usuario_id !== userId).length,

  tienePendientesMias: (mesaId: number, userId: number): boolean =>
    _entregas.some(e => e.mesa_id === mesaId && e.usuario_id === userId),

  tienePendientesMesa: (mesaId: number): boolean =>
    _entregas.some(e => e.mesa_id === mesaId),

  onChange(fn: Listener): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
