import { getAuditoria, getAuditoriaDetalle } from './auditoria.service';
import type { AuditoriaRow, AuditoriaDetalle, AuditoriaLinea, AuditoriaPago } from './auditoria.service';

const fmt = (n: number | string) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(n));

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const fmtTime = (d: string | null) =>
  d ? new Date(d).toLocaleTimeString('es', { timeStyle: 'short' }) : '—';

const ESTADOS: Record<string, { label: string; color: string }> = {
  abierta:        { label: 'Abierta',        color: '#6366f1' },
  en_preparacion: { label: 'En preparación', color: '#f59e0b' },
  lista:          { label: 'Lista',          color: '#10b981' },
  por_cobrar:     { label: 'Por cobrar',     color: '#f97316' },
  cobrada:        { label: 'Cobrada',        color: '#22c55e' },
  cancelada:      { label: 'Cancelada',      color: '#ef4444' },
  anulada:        { label: 'Anulada',        color: '#dc2626' },
  pendiente:      { label: 'Pendiente',      color: '#94a3b8' },
  en_espera:      { label: 'En espera',      color: '#64748b' },
};

const KDS_ESTADOS: Record<string, { label: string; color: string }> = {
  pendiente:      { label: 'Pendiente',      color: '#f59e0b' },
  en_preparacion: { label: 'Preparando',     color: '#3b82f6' },
  lista:          { label: 'Lista',          color: '#22c55e' },
  entregada:      { label: 'Entregada',      color: '#10b981' },
  cancelada:      { label: 'Cancelada',      color: '#ef4444' },
};

function badge(estado: string, map = ESTADOS): string {
  const e = map[estado] ?? { label: estado, color: '#64748b' };
  return `<span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;
    background:${e.color}22;color:${e.color};border:1px solid ${e.color}55">${e.label}</span>`;
}

function exportCsv(rows: AuditoriaRow[]) {
  const headers = ['#Orden','Mesa','Camarero','Estado','Subtotal','Impuestos','Total','Factura','Apertura','Cierre'];
  const lines = rows.map(r => [
    r.numero_orden, r.mesa, r.camarero?.trim(), r.estado,
    r.subtotal, r.impuestos_total, r.total,
    r.numero_factura ?? '',
    fmtDate(r.fecha_apertura), fmtDate(r.fecha_cierre),
  ].map(v => `"${v}"`).join(','));
  const csv = '﻿' + [headers.join(','), ...lines].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
    download: `auditoria_${new Date().toISOString().slice(0,10)}.csv`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Panel de detalle ──────────────────────────────────────────────────────────

function renderLinea(l: AuditoriaLinea): string {
  const kdsRows = l.kds.length
    ? l.kds.map(k => `
        <div style="display:flex;gap:8px;align-items:center;margin-left:16px;font-size:11px;color:#64748b;padding:2px 0">
          <i class="fas fa-tv" style="font-size:10px"></i>
          <span style="font-weight:600">${k.destino}</span>
          ${badge(k.estado, KDS_ESTADOS)}
          <span>${fmtTime(k.tiempo_recibido)} → ${fmtTime(k.tiempo_preparado)}</span>
        </div>`).join('')
    : `<div style="margin-left:16px;font-size:11px;color:#94a3b8">Sin registro KDS</div>`;

  const mods = l.modificadores.length
    ? l.modificadores.map(m =>
        `<div style="margin-left:16px;font-size:11px;color:#6d28d9">
          └ ${m.nombre}${m.precio_extra ? ' +' + fmt(m.precio_extra) : ''}
        </div>`).join('')
    : '';

  const nota = l.notas_linea
    ? `<div style="margin-left:16px;font-size:11px;color:#f59e0b;margin-top:2px">
         <i class="fas fa-comment"></i> ${l.notas_linea}
       </div>`
    : '';

  return `
    <div style="padding:10px 0;border-bottom:1px solid #f1f5f9">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="font-size:13px;font-weight:600">
          <span style="color:#94a3b8;margin-right:4px">${l.cantidad}×</span>${l.articulo_nombre}
          ${l.cuenta_num > 1 ? `<span style="font-size:10px;background:#ede9fe;color:#7c3aed;border-radius:99px;padding:1px 5px;margin-left:4px">C${l.cuenta_num}</span>` : ''}
          ${l.enviado_a_cocina ? '' : '<span style="font-size:10px;background:#fef9c3;color:#854d0e;border-radius:99px;padding:1px 5px;margin-left:4px">No enviado</span>'}
        </div>
        <span style="font-family:monospace;font-size:12px;font-weight:700">${fmt(l.subtotal_linea)}</span>
      </div>
      ${mods}${nota}${kdsRows}
    </div>`;
}

function renderPago(p: AuditoriaPago): string {
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f1f5f9">
      <div>
        <div style="font-size:13px;font-weight:600">${p.forma_pago}</div>
        ${p.referencia ? `<div style="font-size:11px;color:#64748b">Ref: ${p.referencia}</div>` : ''}
        ${p.cajero ? `<div style="font-size:11px;color:#64748b">Cajero: ${p.cajero}</div>` : ''}
        ${p.turno_apertura ? `
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">
            Turno: ${fmtDate(p.turno_apertura)} → ${p.turno_cierre ? fmtDate(p.turno_cierre) : 'Abierto'}
            ${p.turno_monto_apertura != null ? `· Apertura: ${fmt(p.turno_monto_apertura)}` : ''}
          </div>` : ''}
      </div>
      <span style="font-family:monospace;font-size:14px;font-weight:700;color:#16a34a">${fmt(p.monto)}</span>
    </div>`;
}

function renderDetalle(panel: HTMLElement, detalle: AuditoriaDetalle): void {
  const { orden, lineas, pagos } = detalle;

  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0);

  panel.innerHTML = `
    <div class="aud-panel-inner">
      <!-- Cabecera -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:.5px">ORDEN</div>
          <div style="font-size:22px;font-weight:800;font-family:monospace">#${String(orden.numero_orden).padStart(4,'0')}</div>
        </div>
        <button id="aud-panel-close" style="background:none;border:none;cursor:pointer;font-size:18px;color:#94a3b8;padding:4px">✕</button>
      </div>

      <!-- Datos generales -->
      <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div><span style="color:#94a3b8">Mesa</span><br><strong>${orden.mesa ?? '—'}</strong></div>
        <div><span style="color:#94a3b8">Camarero</span><br><strong>${orden.camarero?.trim() || '—'}</strong></div>
        <div><span style="color:#94a3b8">Estado</span><br>${badge(orden.estado)}</div>
        <div><span style="color:#94a3b8">Tipo</span><br><strong>${orden.tipo_servicio ?? '—'}</strong></div>
        <div><span style="color:#94a3b8">Apertura</span><br><strong>${fmtDate(orden.fecha_apertura)}</strong></div>
        <div><span style="color:#94a3b8">Cierre</span><br><strong>${fmtDate(orden.fecha_cierre)}</strong></div>
      </div>

      <!-- Totales -->
      <div style="background:#f0fdf4;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px">
        <div style="display:flex;justify-content:space-between"><span style="color:#64748b">Subtotal</span><span style="font-family:monospace">${fmt(orden.subtotal ?? 0)}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#64748b">Impuestos</span><span style="font-family:monospace">${fmt(orden.impuestos_total ?? 0)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:15px;margin-top:6px;padding-top:6px;border-top:1px solid #bbf7d0">
          <span>Total</span><span style="font-family:monospace">${fmt(orden.total ?? 0)}</span>
        </div>
        ${pagos.length ? `<div style="display:flex;justify-content:space-between;margin-top:4px;color:${totalPagado >= Number(orden.total ?? 0) ? '#16a34a' : '#dc2626'}">
          <span>Pagado</span><span style="font-family:monospace">${fmt(totalPagado)}</span>
        </div>` : ''}
      </div>

      <!-- Factura -->
      ${orden.numero_factura ? `
      <div style="background:#eff6ff;border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:13px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:11px;color:#3b82f6;font-weight:600">FACTURA</div>
          <div style="font-family:monospace;font-weight:700">${orden.numero_factura}</div>
          ${orden.factura_fecha ? `<div style="font-size:11px;color:#64748b">${fmtDate(orden.factura_fecha)}</div>` : ''}
        </div>
        ${orden.factura_anulada ? '<span style="font-size:11px;background:#fee2e2;color:#dc2626;border-radius:99px;padding:2px 8px;font-weight:600">ANULADA</span>' : ''}
      </div>` : ''}

      <!-- Artículos -->
      <div style="margin-bottom:20px">
        <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:.5px;margin-bottom:8px">
          ARTÍCULOS (${lineas.length})
        </div>
        ${lineas.length ? lineas.map(renderLinea).join('') : '<div style="color:#94a3b8;font-size:13px">Sin líneas</div>'}
      </div>

      <!-- Pagos -->
      <div style="margin-bottom:20px">
        <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:.5px;margin-bottom:8px">
          PAGOS (${pagos.length})
        </div>
        ${pagos.length ? pagos.map(renderPago).join('') : '<div style="color:#94a3b8;font-size:13px">Sin pagos registrados</div>'}
      </div>

      ${orden.notas ? `
      <div style="background:#fffbeb;border-radius:8px;padding:10px 12px;font-size:13px">
        <div style="font-size:11px;color:#d97706;font-weight:600;margin-bottom:4px">NOTAS</div>
        ${orden.notas}
      </div>` : ''}
    </div>
  `;

  panel.querySelector('#aud-panel-close')?.addEventListener('click', () => cerrarPanel(panel));
}

function cerrarPanel(panel: HTMLElement): void {
  panel.classList.remove('aud-panel--open');
}

// ── Tabla principal ───────────────────────────────────────────────────────────

function renderTabla(container: HTMLElement, rows: AuditoriaRow[], panel: HTMLElement): void {
  const resultEl = container.querySelector<HTMLElement>('#aud-result')!;

  if (!rows.length) {
    resultEl.innerHTML = `<div class="aud-empty"><i class="fas fa-inbox"></i> Sin registros para los filtros seleccionados.</div>`;
    return;
  }

  resultEl.innerHTML = `
    <div class="aud-toolbar">
      <span class="aud-count">${rows.length} registro(s) — <span style="font-size:11px;color:#94a3b8">Click en una fila para ver el detalle completo</span></span>
      <button class="btn btn-secondary btn-sm" id="aud-export">
        <i class="fas fa-file-csv"></i> Exportar CSV
      </button>
    </div>
    <div class="aud-table-wrapper">
      <table class="aud-table">
        <thead>
          <tr>
            <th>#Orden</th><th>Mesa</th><th>Camarero</th><th>Estado</th>
            <th>Total</th><th>Pagos</th><th>Factura</th>
            <th>Apertura</th><th>Cierre</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr class="aud-row ${r.estado === 'anulada' ? 'row-anulada' : r.estado === 'cobrada' ? 'row-cobrada' : ''}" data-orden-id="${r.orden_id}" style="cursor:pointer">
              <td class="mono">#${String(r.numero_orden).padStart(4,'0')}</td>
              <td>${r.mesa ?? '—'}</td>
              <td>${r.camarero?.trim() || '—'}</td>
              <td>${badge(r.estado)}</td>
              <td class="mono right">${fmt(r.total)}</td>
              <td class="pagos-cell">
                ${(r.pagos ?? []).map(p => `<span class="pago-chip">${p.forma_pago}: ${fmt(p.monto)}</span>`).join('')}
              </td>
              <td class="mono">${r.numero_factura ?? '—'}${r.factura_anulada ? ' <i class="fas fa-ban" style="color:#ef4444" title="Anulada"></i>' : ''}</td>
              <td class="mono">${fmtDate(r.fecha_apertura)}</td>
              <td class="mono">${fmtDate(r.fecha_cierre)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  resultEl.querySelector('#aud-export')?.addEventListener('click', () => exportCsv(rows));

  resultEl.querySelector('tbody')?.addEventListener('click', async (e) => {
    const tr = (e.target as HTMLElement).closest<HTMLElement>('[data-orden-id]');
    if (!tr) return;
    const ordenId = Number(tr.dataset.ordenId);

    // Marcar fila activa
    resultEl.querySelectorAll('.aud-row').forEach(r => r.classList.remove('aud-row--active'));
    tr.classList.add('aud-row--active');

    panel.classList.add('aud-panel--open');
    panel.innerHTML = `<div class="aud-panel-inner" style="padding-top:32px;text-align:center;color:#94a3b8"><i class="fas fa-spinner fa-spin" style="font-size:24px"></i><div style="margin-top:12px">Cargando detalle…</div></div>`;

    try {
      const detalle = await getAuditoriaDetalle(ordenId);
      renderDetalle(panel, detalle);
    } catch {
      panel.innerHTML = `<div class="aud-panel-inner" style="padding:32px;text-align:center;color:#ef4444"><i class="fas fa-exclamation-circle"></i> Error al cargar el detalle.</div>`;
    }
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function Auditoria(container: HTMLElement) {
  const today      = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);

  container.innerHTML = `
    <style>
      .aud-header { display:flex;align-items:center;gap:12px;margin-bottom:4px }
      .aud-header h1 { margin:0;font-size:24px }
      .aud-badge { font-size:11px;background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:2px 8px;border-radius:99px;font-weight:600 }
      .aud-filters { display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px }
      .aud-field { display:flex;flex-direction:column;gap:4px }
      .aud-field label { font-size:12px;font-weight:600;color:#64748b }
      .aud-field input, .aud-field select { padding:7px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px }
      .aud-toolbar { display:flex;justify-content:space-between;align-items:center;margin-bottom:12px }
      .aud-count { font-size:13px;color:#64748b }
      .aud-table-wrapper { overflow-x:auto }
      .aud-table { width:100%;border-collapse:collapse;font-size:13px }
      .aud-table th { background:#f1f5f9;padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e2e8f0;white-space:nowrap }
      .aud-table td { padding:9px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle }
      .aud-table .mono { font-family:monospace;font-size:12px }
      .aud-table .right { text-align:right }
      .aud-row:hover td { background:#f8fafc }
      .aud-row--active td { background:#eff6ff !important;outline:2px solid #3b82f6 }
      .row-cobrada td { background:#f0fdf4 }
      .row-anulada td { background:#fff1f2;color:#991b1b }
      .pagos-cell { display:flex;flex-wrap:wrap;gap:4px }
      .pago-chip { font-size:11px;background:#ede9fe;color:#6d28d9;border-radius:99px;padding:1px 7px;white-space:nowrap }
      .aud-empty { padding:40px;text-align:center;color:#94a3b8;font-size:15px;display:flex;flex-direction:column;align-items:center;gap:12px }
      .aud-empty i { font-size:32px }
      .aud-loading { padding:24px;text-align:center;color:#64748b }

      /* Panel deslizable */
      .aud-panel { position:fixed;top:0;right:0;width:420px;max-width:100vw;height:100vh;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,0.12);z-index:999;transform:translateX(100%);transition:transform .25s ease;overflow-y:auto }
      .aud-panel--open { transform:translateX(0) }
      .aud-panel-inner { padding:20px }

      /* Layout con panel */
      .aud-layout { display:flex;gap:0;min-height:0 }
      .aud-main { flex:1;min-width:0;transition:margin-right .25s ease }
    </style>

    <div class="aud-header">
      <i class="fas fa-shield-halved" style="font-size:28px;color:#6366f1"></i>
      <h1>Auditoría de Transacciones</h1>
      <span class="aud-badge">DEVELOPER</span>
    </div>
    <p style="color:#64748b;font-size:14px;margin:0 0 20px">Click en cualquier fila para ver el detalle completo: artículos, KDS, pagos y turno de caja.</p>

    <div class="aud-filters">
      <div class="aud-field">
        <label>Fecha inicio</label>
        <input type="date" id="aud-fi" value="${firstOfMonth}" />
      </div>
      <div class="aud-field">
        <label>Fecha fin</label>
        <input type="date" id="aud-ff" value="${today}" />
      </div>
      <div class="aud-field">
        <label>Estado</label>
        <select id="aud-estado">
          <option value="">Todos</option>
          <option value="abierta">Abierta</option>
          <option value="en_preparacion">En preparación</option>
          <option value="por_cobrar">Por cobrar</option>
          <option value="cobrada">Cobrada</option>
          <option value="cancelada">Cancelada</option>
          <option value="anulada">Anulada</option>
        </select>
      </div>
      <div class="aud-field">
        <label>Sucursal ID</label>
        <input type="number" id="aud-suc" value="1" min="1" style="width:80px" />
      </div>
      <button class="btn btn-primary" id="aud-buscar">
        <i class="fas fa-search"></i> Buscar
      </button>
    </div>

    <div id="aud-result" style="margin-top:24px"></div>
  `;

  // Panel lateral (fuera del container para no quedar atrapado en overflow)
  const panel = document.createElement('div');
  panel.className = 'aud-panel';
  document.body.appendChild(panel);

  // Cerrar panel al click fuera
  document.addEventListener('pointerdown', (e) => {
    if (panel.classList.contains('aud-panel--open') && !panel.contains(e.target as Node)) {
      cerrarPanel(panel);
      container.querySelectorAll('.aud-row--active').forEach(r => r.classList.remove('aud-row--active'));
    }
  });

  const buscar = async () => {
    const resultEl = container.querySelector<HTMLElement>('#aud-result')!;
    const fi  = (container.querySelector<HTMLInputElement>('#aud-fi')!).value;
    const ff  = (container.querySelector<HTMLInputElement>('#aud-ff')!).value;
    const est = (container.querySelector<HTMLSelectElement>('#aud-estado')!).value;
    const suc = Number((container.querySelector<HTMLInputElement>('#aud-suc')!).value) || undefined;

    resultEl.innerHTML = `<div class="aud-loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>`;
    cerrarPanel(panel);

    try {
      const rows = await getAuditoria({ fecha_inicio: fi || undefined, fecha_fin: ff || undefined, estado: est || undefined, sucursal_id: suc });
      renderTabla(container, rows, panel);
    } catch (err: any) {
      resultEl.innerHTML = `<div class="aud-empty"><i class="fas fa-exclamation-circle" style="color:#ef4444"></i>${err.message ?? 'Error al cargar.'}</div>`;
    }
  };

  container.querySelector('#aud-buscar')?.addEventListener('click', buscar);
  buscar();
}
