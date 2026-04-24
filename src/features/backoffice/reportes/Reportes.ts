import './reportes.css';
import { getReporteVentas } from './reportes.service';
import type { AreaReporte, ReporteVentas } from './reportes.types';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);

function exportToExcel(data: ReporteVentas) {
  const rows: string[][] = [];

  rows.push(['REPORTE DE VENTAS']);
  rows.push([`Período: ${data.periodo.fecha_inicio} al ${data.periodo.fecha_fin}`]);
  rows.push([`Sucursal ID: ${data.sucursal_id}`]);
  rows.push([]);

  rows.push(['RESUMEN']);
  rows.push(['Total Órdenes', 'Subtotal', 'Impuestos', 'Total Ventas']);
  rows.push([
    String(data.resumen.total_ordenes),
    String(data.resumen.subtotal),
    String(data.resumen.impuestos),
    String(data.resumen.total_ventas),
  ]);
  rows.push([]);

  rows.push(['DETALLE DE IMPUESTOS']);
  rows.push(['ID', 'Nombre', 'Porcentaje (%)', 'Monto']);
  data.impuestos_detalle.forEach(i =>
    rows.push([String(i.impuesto_id), i.nombre, String(i.porcentaje), String(i.monto)])
  );
  rows.push([]);

  rows.push(['POR FORMA DE PAGO']);
  rows.push(['ID', 'Forma de Pago', 'Total', 'Transacciones']);
  data.por_forma_pago.forEach(p =>
    rows.push([String(p.forma_pago_id), p.forma_pago, String(p.total), String(p.cantidad_transacciones)])
  );

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_ventas_${data.periodo.fecha_inicio}_${data.periodo.fecha_fin}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderReport(container: HTMLElement, data: ReporteVentas) {
  const report = container.querySelector<HTMLElement>('#rep-result')!;

  report.innerHTML = `
    <!-- Resumen -->
    <div class="rep-summary">
      <div class="rep-card">
        <span class="rep-card-label">Total Órdenes</span>
        <span class="rep-card-value">${data.resumen.total_ordenes}</span>
      </div>
      <div class="rep-card">
        <span class="rep-card-label">Subtotal</span>
        <span class="rep-card-value">${fmt(data.resumen.subtotal)}</span>
      </div>
      <div class="rep-card">
        <span class="rep-card-label">Impuestos</span>
        <span class="rep-card-value">${fmt(data.resumen.impuestos)}</span>
      </div>
      <div class="rep-card accent">
        <span class="rep-card-label">Total Ventas</span>
        <span class="rep-card-value">${fmt(data.resumen.total_ventas)}</span>
      </div>
    </div>

    <!-- Impuestos detalle -->
    <div class="rep-section">
      <div class="rep-section-header">
        <h2><i class="fas fa-percentage"></i> Detalle de Impuestos</h2>
        <button class="btn-excel" id="btn-excel-impuestos">
          <i class="fas fa-file-excel"></i> Exportar Excel
        </button>
      </div>
      <table class="rep-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Porcentaje</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          ${data.impuestos_detalle.length === 0
            ? `<tr><td colspan="4" class="rep-empty">Sin datos</td></tr>`
            : data.impuestos_detalle.map(i => `
              <tr>
                <td>${i.impuesto_id}</td>
                <td>${i.nombre}</td>
                <td>${i.porcentaje}%</td>
                <td>${fmt(i.monto)}</td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- Formas de pago -->
    <div class="rep-section">
      <div class="rep-section-header">
        <h2><i class="fas fa-credit-card"></i> Por Forma de Pago</h2>
        <button class="btn-excel" id="btn-excel-pagos">
          <i class="fas fa-file-excel"></i> Exportar Excel
        </button>
      </div>
      <table class="rep-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Forma de Pago</th>
            <th>Total</th>
            <th>Transacciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.por_forma_pago.length === 0
            ? `<tr><td colspan="4" class="rep-empty">Sin datos</td></tr>`
            : data.por_forma_pago.map(p => `
              <tr>
                <td>${p.forma_pago_id}</td>
                <td>${p.forma_pago}</td>
                <td>${fmt(p.total)}</td>
                <td>${p.cantidad_transacciones}</td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;

  report.querySelector('#btn-excel-impuestos')?.addEventListener('click', () => exportToExcel(data));
  report.querySelector('#btn-excel-pagos')?.addEventListener('click', () => exportToExcel(data));
}

export function Reportes(container: HTMLElement) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfYear = `${new Date().getFullYear()}-01-01`;
  let areaActiva: AreaReporte = 'total';

  container.innerHTML = `
    <div class="rep-wrapper">
      <div class="rep-header">
        <i class="fas fa-chart-bar"></i>
        <h1>Reportes de Ventas</h1>
      </div>

      <div class="rep-area-tabs">
        <button class="rep-area-tab active" data-area="total"><i class="fas fa-layer-group"></i> Total</button>
        <button class="rep-area-tab" data-area="cocina"><i class="fas fa-fire-burner"></i> Cocina</button>
        <button class="rep-area-tab" data-area="barra"><i class="fas fa-martini-glass"></i> Barra</button>
      </div>

      <div class="rep-filters">
        <div class="rep-field">
          <label>Fecha inicio</label>
          <input type="date" id="rep-fecha-inicio" value="${firstOfYear}" />
        </div>
        <div class="rep-field">
          <label>Fecha fin</label>
          <input type="date" id="rep-fecha-fin" value="${today}" />
        </div>
        <div class="rep-field">
          <label>Sucursal ID</label>
          <input type="number" id="rep-sucursal" value="1" min="1" style="width:90px" />
        </div>
        <button class="btn btn-primary" id="rep-btn-buscar">
          <i class="fas fa-search"></i> Generar reporte
        </button>
      </div>

      <div id="rep-result"></div>
    </div>
  `;

  // ── Tabs de área ────────────────────────────────────────────────────────────
  container.querySelectorAll<HTMLButtonElement>('.rep-area-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.rep-area-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      areaActiva = tab.dataset.area as AreaReporte;
    });
  });

  const btnBuscar = container.querySelector<HTMLButtonElement>('#rep-btn-buscar')!;

  const buscar = async () => {
    const fecha_inicio = (container.querySelector<HTMLInputElement>('#rep-fecha-inicio')!).value;
    const fecha_fin    = (container.querySelector<HTMLInputElement>('#rep-fecha-fin')!).value;
    const sucursal_id  = Number((container.querySelector<HTMLInputElement>('#rep-sucursal')!).value);
    const result       = container.querySelector<HTMLElement>('#rep-result')!;

    if (!fecha_inicio || !fecha_fin || !sucursal_id) {
      result.innerHTML = `<div class="rep-message error"><i class="fas fa-exclamation-circle"></i> Complete todos los filtros.</div>`;
      return;
    }

    btnBuscar.disabled = true;
    result.innerHTML = `<div class="rep-message loading"><i class="fas fa-spinner fa-spin"></i> Cargando reporte...</div>`;

    try {
      const data = await getReporteVentas({ fecha_inicio, fecha_fin, sucursal_id, area: areaActiva });
      renderReport(container, data);
    } catch (err: any) {
      result.innerHTML = `<div class="rep-message error"><i class="fas fa-exclamation-circle"></i> ${err.message ?? 'Error al cargar el reporte.'}</div>`;
    } finally {
      btnBuscar.disabled = false;
    }
  };

  btnBuscar.addEventListener('click', buscar);
}
