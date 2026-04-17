import { checkRoleAccess } from '@/global/guards_auth';
import { doLogout } from '@/global/logOut';
const _allowed = checkRoleAccess(['camarero', 'recepcionista', 'encargado']);

import { toast } from '../shared/utils/toast';
import { ReservacionesStore } from './reservaciones.store';
import { DEMO_RV } from './reservaciones.demo';
import type { Mesa, Reservacion } from './reservaciones.types';

// ─── Orquestador ──────────────────────────────────────────────────────────────

class ReservacionesPage {
  private readonly _store = new ReservacionesStore();

  // ─── Init ──────────────────────────────────────────────────────────────────

  init(): void {
    this._applyTheme();
    this._loadData();
    this._wireEvents();
  }

  private _applyTheme(): void {
    document.documentElement.style.setProperty('--accent',     '#1a52cc');
    document.documentElement.style.setProperty('--accent-rgb', '26,82,204');
    document.documentElement.style.setProperty('--accent2',    '#2563eb');
  }

  // ─── Carga inicial ─────────────────────────────────────────────────────────

  private _loadData(): void {
    this._store.setZonas(DEMO_RV.zonas);
    this._store.setMesas(DEMO_RV.mesas.map(m => ({ ...m })));
    this._store.setReservaciones(DEMO_RV.reservaciones.map(r => ({ ...r })));
    if (!this._store.state.zonaActiva) {
      this._store.setZonaActiva(DEMO_RV.zonas[0]?.id ?? 0);
    }

    const userEl = document.getElementById('topbar-user');
    if (userEl) {
      try {
        const raw = localStorage.getItem('pos_user');
        userEl.textContent = raw
          ? (JSON.parse(raw) as { nombre?: string }).nombre ?? '—'
          : '—';
      } catch { userEl.textContent = '—'; }
    }

    this._renderZonas();
    this._renderMesas();
  }

  // ─── Floor plan ────────────────────────────────────────────────────────────

  private _renderZonas(): void {
    const { zonas, zonaActiva } = this._store.state;
    const el = document.getElementById('zonas-tabs');
    if (!el) return;
    el.innerHTML = zonas.map(z => `
      <button class="zona-tab ${z.id === zonaActiva ? 'active' : ''}" data-zona="${z.id}">
        ${z.nombre}
      </button>
    `).join('');
  }

  private _renderMesas(): void {
    const { mesas, zonaActiva, reservaciones } = this._store.state;
    const el = document.getElementById('mesas-grid');
    if (!el) return;

    const visible = mesas.filter(m => m.zona_id === zonaActiva);

    el.innerHTML = visible.map(m => {
      const reserva = reservaciones.find(r => r.mesa_id === m.id);

      // Sub-etiqueta: para mesas reservadas muestra el nombre del cliente
      const subLabel = m.estado === 'por_cobrar'
        ? 'cobrar'
        : m.estado === 'reservada' && reserva
          ? reserva.nombre_cliente.split(' ')[0]
          : m.estado;

      const cap      = m.capacidad || 4;
      const pers     = m.personas  || 0;
      const topCount = Math.ceil(cap / 2);
      const botCount = Math.floor(cap / 2);
      const ocupTop  = Math.min(pers, topCount);
      const ocupBot  = Math.max(0, pers - ocupTop);

      const siTop = Array.from({ length: topCount }, (_, i) =>
        `<div class="silla ${i < ocupTop ? 'silla-ocup' : ''}"></div>`,
      ).join('');
      const siBot = Array.from({ length: botCount }, (_, i) =>
        `<div class="silla ${i < ocupBot ? 'silla-ocup' : ''}"></div>`,
      ).join('');

      // Badge de hora para mesas reservadas
      const timeBadge = m.estado === 'reservada' && reserva
        ? `<span class="rv-time-badge">${this._formatHora(reserva.fecha_hora)}</span>`
        : '';

      return `
        <div class="mesa-fp mesa-${m.estado}"
          style="--top-count:${topCount}"
          data-mesa-id="${m.id}">
          <div class="sillas-top">${siTop}</div>
          <div style="position:relative;display:inline-block">
            ${timeBadge}
            <div class="mesa-superficie">
              <span class="mesa-fp-nombre">${m.nombre}</span>
              <span class="mesa-fp-personas">${pers}/${cap}</span>
              <span class="mesa-fp-estado">${subLabel}</span>
            </div>
          </div>
          <div class="sillas-bottom">${siBot}</div>
        </div>
      `;
    }).join('');
  }

  // ─── Click en mesa ─────────────────────────────────────────────────────────

  private _handleMesaClick(mesaId: number): void {
    const mesa = this._store.getMesa(mesaId);
    if (!mesa) return;

    if (mesa.estado === 'libre') {
      this._abrirNuevaReserva(mesa);
    } else if (mesa.estado === 'reservada') {
      this._abrirDetalleReserva(mesa);
    } else {
      toast('Esta mesa no está disponible para reservar');
    }
  }

  // ─── Modal: nueva / editar reserva ────────────────────────────────────────

  private _abrirNuevaReserva(mesa: Mesa, editar?: Reservacion): void {
    this._store.setMesaSeleccionada(mesa);
    this._store.setReservacionSeleccionada(editar ?? null);

    const titleEl    = document.getElementById('nueva-reserva-title');
    const subtitleEl = document.getElementById('nueva-reserva-subtitle');
    if (titleEl)    titleEl.textContent    = editar ? 'Editar Reserva' : 'Nueva Reserva';
    if (subtitleEl) subtitleEl.textContent = `Mesa ${mesa.nombre} — capacidad ${mesa.capacidad} personas`;

    // Fecha/hora: próxima hora redonda o la existente al editar
    const fechaInput = document.getElementById('rv-fecha') as HTMLInputElement | null;
    if (fechaInput) {
      if (editar) {
        fechaInput.value = editar.fecha_hora;
      } else {
        const d = new Date();
        d.setHours(d.getHours() + 1, 0, 0, 0);
        const offset = d.getTimezoneOffset();
        const local  = new Date(d.getTime() - offset * 60_000);
        fechaInput.value = local.toISOString().slice(0, 16);
      }
    }

    // Pre-rellenar campos
    (document.getElementById('rv-nombre')   as HTMLInputElement  | null)!.value  = editar?.nombre_cliente ?? '';
    (document.getElementById('rv-telefono') as HTMLInputElement  | null)!.value  = editar?.telefono      ?? '';
    (document.getElementById('rv-notas')    as HTMLTextAreaElement | null)!.value = editar?.notas         ?? '';

    // Grid de personas
    const defaultPersonas = editar?.num_personas ?? Math.ceil(mesa.capacidad / 2);
    this._store.setFormPersonas(defaultPersonas);
    this._renderPersonasGrid(mesa.capacidad);

    document.getElementById('modal-nueva-reserva')!.style.display = 'flex';
  }

  private _renderPersonasGrid(capacidad: number): void {
    const grid     = document.getElementById('rv-personas-grid');
    if (!grid) return;
    const selected = this._store.state.formPersonas;
    grid.innerHTML = Array.from({ length: capacidad }, (_, i) => i + 1).map(n => `
      <button class="comensal-btn ${n === selected ? 'selected' : ''}" data-rv-n="${n}">${n}</button>
    `).join('');
  }

  private _guardarReserva(): void {
    const mesa = this._store.state.mesaSeleccionada;
    if (!mesa) return;

    const nombre    = (document.getElementById('rv-nombre')    as HTMLInputElement)?.value.trim();
    const telefono  = (document.getElementById('rv-telefono')  as HTMLInputElement)?.value.trim();
    const fechaHora = (document.getElementById('rv-fecha')     as HTMLInputElement)?.value;
    const notas     = (document.getElementById('rv-notas')     as HTMLTextAreaElement)?.value.trim();
    const personas  = this._store.state.formPersonas;

    if (!nombre)    { toast('El nombre del cliente es obligatorio'); return; }
    if (!telefono)  { toast('El teléfono es obligatorio'); return; }
    if (!fechaHora) { toast('La fecha y hora son obligatorias'); return; }

    const existente = this._store.state.reservacionSeleccionada;

    if (existente) {
      this._store.updateReservacion(existente.id, {
        nombre_cliente: nombre, telefono, fecha_hora: fechaHora,
        num_personas: personas, notas,
      });
      toast('Reserva actualizada ✓', 'success');
    } else {
      const reservacion: Reservacion = {
        id: this._store.nextId(),
        mesa_id: mesa.id,
        nombre_cliente: nombre,
        telefono,
        fecha_hora: fechaHora,
        num_personas: personas,
        notas,
        estado: 'pendiente',
      };
      this._store.addReservacion(reservacion);
      this._store.patchMesa(mesa.id, { estado: 'reservada' });
      toast('Mesa reservada ✓', 'success');
    }

    this._cerrarNuevaReserva();
    this._renderMesas();
  }

  private _cerrarNuevaReserva(): void {
    document.getElementById('modal-nueva-reserva')!.style.display = 'none';
    this._store.setMesaSeleccionada(null);
    this._store.setReservacionSeleccionada(null);
  }

  // ─── Modal: detalle de reserva ─────────────────────────────────────────────

  private _abrirDetalleReserva(mesa: Mesa): void {
    const reserva = this._store.getReservacion(mesa.id);
    if (!reserva) { toast('No se encontró la reservación'); return; }

    this._store.setMesaSeleccionada(mesa);
    this._store.setReservacionSeleccionada(reserva);

    const titleEl = document.getElementById('detalle-mesa-title');
    if (titleEl) titleEl.textContent = 'Mesa ' + mesa.nombre;

    const body = document.getElementById('detalle-body');
    if (body) {
      body.innerHTML = `
        <div class="rv-detalle-row">
          <span class="rv-detalle-label">Cliente</span>
          <span class="rv-detalle-val">${this._esc(reserva.nombre_cliente)}</span>
        </div>
        <div class="rv-detalle-row">
          <span class="rv-detalle-label">Teléfono</span>
          <span class="rv-detalle-val">${this._esc(reserva.telefono)}</span>
        </div>
        <div class="rv-detalle-row">
          <span class="rv-detalle-label">Fecha y hora</span>
          <span class="rv-detalle-val">${this._formatFechaHora(reserva.fecha_hora)}</span>
        </div>
        <div class="rv-detalle-row">
          <span class="rv-detalle-label">Personas</span>
          <span class="rv-detalle-val">${reserva.num_personas} / ${mesa.capacidad}</span>
        </div>
        <div class="rv-detalle-row">
          <span class="rv-detalle-label">Estado</span>
          <span class="rv-detalle-val">
            <span class="rv-estado-badge ${reserva.estado}">${reserva.estado}</span>
          </span>
        </div>
        ${reserva.notas ? `
        <div class="rv-detalle-row">
          <span class="rv-detalle-label">Notas</span>
          <span class="rv-detalle-val rv-detalle-notas">${this._esc(reserva.notas)}</span>
        </div>` : ''}
      `;
    }

    document.getElementById('modal-detalle-reserva')!.style.display = 'flex';
  }

  private _cerrarDetalleReserva(): void {
    document.getElementById('modal-detalle-reserva')!.style.display = 'none';
    this._store.setMesaSeleccionada(null);
    this._store.setReservacionSeleccionada(null);
  }

  private _confirmarLlegada(): void {
    const { mesaSeleccionada, reservacionSeleccionada } = this._store.state;
    if (!mesaSeleccionada || !reservacionSeleccionada) return;

    this._store.removeReservacion(reservacionSeleccionada.id);
    this._store.patchMesa(mesaSeleccionada.id, { estado: 'libre' });
    toast('Llegada confirmada ✓', 'success');
    this._cerrarDetalleReserva();
    this._renderMesas();
  }

  private _cancelarReserva(): void {
    const { mesaSeleccionada, reservacionSeleccionada } = this._store.state;
    if (!mesaSeleccionada || !reservacionSeleccionada) return;

    this._store.removeReservacion(reservacionSeleccionada.id);
    this._store.patchMesa(mesaSeleccionada.id, { estado: 'libre' });
    toast('Reserva cancelada');
    this._cerrarDetalleReserva();
    this._renderMesas();
  }

  private _editarReserva(): void {
    const { mesaSeleccionada, reservacionSeleccionada } = this._store.state;
    if (!mesaSeleccionada || !reservacionSeleccionada) return;
    this._cerrarDetalleReserva();
    this._abrirNuevaReserva(mesaSeleccionada, reservacionSeleccionada);
  }

  // ─── Wiring de eventos ─────────────────────────────────────────────────────

  private _wireEvents(): void {
    // Zonas tabs
    document.getElementById('zonas-tabs')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-zona]');
      if (!btn) return;
      this._store.setZonaActiva(Number(btn.dataset.zona));
      this._renderZonas();
      this._renderMesas();
    });

    // Floor plan
    document.getElementById('mesas-grid')?.addEventListener('click', e => {
      const fp = (e.target as HTMLElement).closest<HTMLElement>('[data-mesa-id]');
      if (!fp) return;
      this._handleMesaClick(Number(fp.dataset.mesaId));
    });

    // Grid de personas (delegación de eventos)
    document.getElementById('rv-personas-grid')?.addEventListener('click', e => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-rv-n]');
      if (!btn) return;
      this._store.setFormPersonas(Number(btn.dataset.rvN));
      const cap = this._store.state.mesaSeleccionada?.capacidad ?? 8;
      this._renderPersonasGrid(cap);
    });

    // Modal nueva reserva
    document.getElementById('btn-guardar-reserva')?.addEventListener('click',  () => this._guardarReserva());
    document.getElementById('btn-cancelar-nueva')?.addEventListener('click',   () => this._cerrarNuevaReserva());
    document.getElementById('modal-nueva-reserva')?.addEventListener('click', e => {
      if (e.target === document.getElementById('modal-nueva-reserva')) this._cerrarNuevaReserva();
    });

    // Modal detalle
    document.getElementById('btn-confirmar-llegada')?.addEventListener('click', () => this._confirmarLlegada());
    document.getElementById('btn-cancelar-reserva')?.addEventListener('click',  () => this._cancelarReserva());
    document.getElementById('btn-editar-reserva')?.addEventListener('click',    () => this._editarReserva());
    document.getElementById('modal-detalle-reserva')?.addEventListener('click', e => {
      if (e.target === document.getElementById('modal-detalle-reserva')) this._cerrarDetalleReserva();
    });

    // Salir
    document.getElementById('btn-exit')?.addEventListener('click', () => doLogout());
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private _formatHora(fechaHora: string): string {
    try {
      return new Date(fechaHora).toLocaleTimeString('es', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
    } catch { return fechaHora; }
  }

  private _formatFechaHora(fechaHora: string): string {
    try {
      const d = new Date(fechaHora);
      return d.toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short' })
        + ' — '
        + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return fechaHora; }
  }

  /** Escapa HTML básico para evitar XSS al renderizar datos del usuario */
  private _esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (_allowed) new ReservacionesPage().init();
