// ============================================
// Feature: Sucursales — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as sucursalesService from './sucursales.service';
import { sucursalesHeaders } from './datatable_config/sucursales.headers';
import { toSucursalesGridRows } from './datatable_config/sucursales.body';
import { getSucursalesFields } from './form_config/sucursales.fields';
import { buildDeleteBody } from './form_config/sucursales.delete';
import type { Sucursales, SucursalesCreateDTO } from './sucursales.types';
import * as empresasService from '@/features/backoffice/empresas/empresas.service';
import * as sucursalImpuestosService from '@/features/backoffice/sucursalimpuestos/sucursalimpuestos.service';
import * as impuestosService from '@/features/backoffice/impuestos/impuestos.service';
import type { SucursalImpuestos as SucursalImpuestosType } from '@/features/backoffice/sucursalimpuestos/sucursalimpuestos.types';
import type { Impuestos as ImpuestosType } from '@/features/backoffice/impuestos/impuestos.types';


// ---- Helper ----

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: string | string[] }).message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg;
  }
  return 'Error desconocido';
};

// ---- Feature class ----

export class SucursalesFeature {
  // State
  private _sucursales: Sucursales[] = [];
  private _saving = false;
  private _selectedSucursales: Sucursales | null = null;
  private _empresasOptions: Array<{ value: number; label: string }> = [];
  private _impuestosAll: ImpuestosType[] = [];

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;
  private readonly _modalImpuestos: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear Sucursales',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar Sucursales',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar Sucursales',
      size: 'sm',
      onClose: () => this._modalDelete.close(),
    });

    this._modalImpuestos = ModalX({
      title: 'Impuestos de Sucursal',
      size: 'lg',
      onClose: () => this._modalImpuestos.close(),
    });
  }

  mount(container: HTMLElement): void {
    container.innerHTML = '';

    // --- Header ---
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px';

    const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'Sucursales';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo Sucursales';
    btnNew.className = 'btn btn-success';
    btnNew.addEventListener('click', () => this._openCreate());

    header.appendChild(pageTitle);
    header.appendChild(btnNew);

    // --- Loading ---
    this._loadingEl = document.createElement('p');
    this._loadingEl.textContent = 'Cargando...';
    this._loadingEl.style.cssText = 'color:#6b7280;margin:8px 0;display:none';

    // --- Gridie ---
    this._gridie = new Gridie({
      id: 'sucursales-table',
      identityField: 'id',
      headers: sucursalesHeaders,
      body: [],
      enableSort: true,
      enableFilter: true,
      language: 'es',
      paging: {
        enabled: true,
        pageSize: { visible: true, default: 10, options: [10, 25, 50, 100] },
        showInfo: true,
        navigation: { visible: true, showPrevNext: true, showFirstLast: true, maxButtons: 5 },
        position: 'bottom',
      },
    });

    container.appendChild(header);
    container.appendChild(this._loadingEl);
    container.appendChild(this._gridie);

    this._fetchRelatedOptions().then(() => this._fetch());
  }

  // ---- Data ----

  private async _fetch(): Promise<void> {
    this._loadingEl.style.display = 'block';
    try {
      this._sucursales = filterExcluded(await sucursalesService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [empresasRaw, impuestosRaw] = await Promise.all([
        empresasService.getAll(),
        impuestosService.getAll(),
      ]);
      this._empresasOptions = filterExcluded(empresasRaw).map((item: any) => ({
        value: item.id,
        label: item.nombre ?? String(item.id),
      }));
      this._impuestosAll = impuestosRaw;
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: Sucursales): void {
    requestAnimationFrame(() => {
      form.querySelectorAll('select-x').forEach((el) => {
        const selEl = el as any;
        const fieldName = selEl.getAttribute('name') as string | null;
        if (!fieldName) return;
        const rawVal = (data as any)[fieldName];
        if (rawVal == null) return;
        const match = (selEl._options as Array<{ value: any; label: string }> | undefined)
          ?.find((o) => String(o.value) === String(rawVal));
        if (!match) return;
        selEl._selectedOption = match;
        if (selEl._inputEl) selEl._inputEl.value = match.label;
        selEl._updateClearBtn?.();
      });
    });
  }

  private _refreshGrid(): void {
    this._gridie.setBody(
      toSucursalesGridRows(this._sucursales, {
        onEdit:      (item) => this._openEdit(item),
        onDelete:    (item) => this._openDelete(item),
        onImpuestos: (item) => this._openImpuestos(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedSucursales = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: Sucursales): void {
    this._selectedSucursales = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: Sucursales): void {
    this._selectedSucursales = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: Sucursales | null, modal: ModalXInstance): HTMLElement {
    const isEdit = initialData !== null;

    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'display:none;align-items:center;gap:8px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#dc2626;font-size:14px;margin-top:4px';
    errorMsg.innerHTML = '<span>⚠</span><span>Por favor, corrija los errores marcados antes de continuar.</span>';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => modal.close());

    const submitBtn = document.createElement('button');
    submitBtn.setAttribute('data-submitx', '');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = isEdit ? 'Actualizar' : 'Crear';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:4px';
    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);

    const form = FormX({
      validateOn: 'blur',
      onSubmit: async (result) => {
        if (!result.general_validation) {
          errorMsg.style.display = 'flex';
          return;
        }
        errorMsg.style.display = 'none';
        if (this._saving) return;
        this._saving = true;
        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          const data: SucursalesCreateDTO = {
            empresa_id: result.body['empresa_id'] as number,
            nombre: result.body['nombre'] as string,
            direccion: result.body['direccion'] as string,
            telefono: result.body['telefono'] as string,
          };

          if (isEdit) {
            await sucursalesService.update(initialData.id, data);
            toastx.success('Sucursales actualizado correctamente');
          } else {
            await sucursalesService.create(data);
            toastx.success('Sucursales creado correctamente');
          }

          modal.close();
          await this._fetch();
        } catch (err) {
          toastx.error(getErrorMessage(err));
          submitBtn.disabled = false;
          cancelBtn.disabled = false;
          submitBtn.textContent = isEdit ? 'Actualizar' : 'Crear';
        } finally {
          this._saving = false;
        }
      },
      children: [
        ...getSucursalesFields(initialData, {
          empresasOptions: this._empresasOptions,
        }),
        errorMsg,
        actions,
      ],
    });

    return form;
  }

  // ---- Delete modal ----

  private _buildDeleteFooter(): HTMLElement[] {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => this._modalDelete.close());

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Eliminar';

    deleteBtn.addEventListener('click', async () => {
      if (!this._selectedSucursales || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await sucursalesService.remove(this._selectedSucursales.id);
        toastx.success('Sucursales eliminado correctamente');
        this._modalDelete.close();
        await this._fetch();
      } catch (err) {
        toastx.error(getErrorMessage(err));
        deleteBtn.disabled = false;
        cancelBtn.disabled = false;
        deleteBtn.textContent = 'Eliminar';
      } finally {
        this._saving = false;
      }
    });

    return [cancelBtn, deleteBtn];
  }

  // ---- Impuestos modal ----

  private _openImpuestos(sucursal: Sucursales): void {
    const container = document.createElement('div');
    const refresh = () => this._renderImpuestosContent(sucursal, container, refresh);
    refresh();

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Cerrar';
    closeBtn.addEventListener('click', () => this._modalImpuestos.close());

    this._modalImpuestos.setBody(container);
    this._modalImpuestos.setFooter([closeBtn]);
    this._modalImpuestos.open();
  }

  private async _renderImpuestosContent(
    sucursal: Sucursales,
    container: HTMLElement,
    refresh: () => void,
  ): Promise<void> {
    container.innerHTML = '<p style="color:#6b7280;text-align:center;padding:32px 0">Cargando...</p>';
    try {
      const all = await sucursalImpuestosService.getAll();
      const assigned = (all as SucursalImpuestosType[]).filter(si => si.sucursal_id === sucursal.id);

      container.innerHTML = '';

      // Info bar
      const infoBar = document.createElement('div');
      infoBar.style.cssText = 'padding:8px 12px;background:#eff6ff;border:1px solid #dbeafe;border-radius:6px;margin-bottom:20px;color:#1d4ed8;font-size:14px;font-weight:500';
      infoBar.textContent = `Sucursal: ${sucursal.nombre ?? '—'}`;
      container.appendChild(infoBar);

      container.appendChild(this._buildAssignedSection(assigned, refresh));

      const divider = document.createElement('hr');
      divider.style.cssText = 'border:none;border-top:1px solid #e5e7eb;margin:20px 0';
      container.appendChild(divider);

      container.appendChild(this._buildAddSection(sucursal, assigned, refresh));
    } catch (err) {
      container.innerHTML = '<p style="color:#dc2626;text-align:center;padding:32px 0">Error al cargar los impuestos.</p>';
    }
  }

  private _buildAssignedSection(
    assigned: SucursalImpuestosType[],
    refresh: () => void,
  ): HTMLElement {
    const section = document.createElement('div');

    const title = document.createElement('h3');
    title.style.cssText = 'font-size:15px;font-weight:600;margin:0 0 12px;color:#111827';
    title.textContent = `Impuestos asignados (${assigned.length})`;
    section.appendChild(title);

    if (assigned.length === 0) {
      const empty = document.createElement('p');
      empty.style.cssText = 'color:#6b7280;font-size:14px;padding:8px 0';
      empty.textContent = 'Esta sucursal no tiene impuestos asignados.';
      section.appendChild(empty);
      return section;
    }

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px';
    table.innerHTML = `
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600">Impuesto</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600">Porcentaje</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600">Obligatorio</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600">Orden</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600"></th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement('tbody');
    assigned.forEach((si, idx) => {
      const imp = this._impuestosAll.find(i => i.id === si.impuesto_id);
      const tr = document.createElement('tr');
      if (idx % 2 === 1) tr.style.background = '#f9fafb';

      const tdNombre = document.createElement('td');
      tdNombre.style.cssText = 'padding:8px 12px;border-bottom:1px solid #f3f4f6';
      tdNombre.textContent = imp?.nombre ?? `ID: ${si.impuesto_id}`;

      const tdPorcentaje = document.createElement('td');
      tdPorcentaje.style.cssText = 'padding:8px 12px;border-bottom:1px solid #f3f4f6';
      tdPorcentaje.textContent = imp?.porcentaje != null ? `${imp.porcentaje}%` : '—';

      const tdObligatorio = document.createElement('td');
      tdObligatorio.style.cssText = 'padding:8px 12px;text-align:center;border-bottom:1px solid #f3f4f6';
      const badge = document.createElement('span');
      if (si.obligatorio) {
        badge.style.cssText = 'padding:2px 8px;background:#dcfce7;color:#16a34a;border-radius:12px;font-size:12px;font-weight:500';
        badge.textContent = 'Sí';
      } else {
        badge.style.cssText = 'padding:2px 8px;background:#f3f4f6;color:#6b7280;border-radius:12px;font-size:12px';
        badge.textContent = 'No';
      }
      tdObligatorio.appendChild(badge);

      const tdOrden = document.createElement('td');
      tdOrden.style.cssText = 'padding:8px 12px;text-align:center;border-bottom:1px solid #f3f4f6';
      tdOrden.textContent = si.orden_aplicacion != null ? String(si.orden_aplicacion) : '—';

      const tdAcciones = document.createElement('td');
      tdAcciones.style.cssText = 'padding:8px 12px;text-align:center;border-bottom:1px solid #f3f4f6';
      const quitarBtn = document.createElement('button');
      quitarBtn.style.cssText = 'padding:4px 10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:4px;font-size:12px;font-weight:500;cursor:pointer';
      quitarBtn.textContent = 'Quitar';
      quitarBtn.addEventListener('click', async () => {
        quitarBtn.disabled = true;
        quitarBtn.textContent = 'Quitando...';
        try {
          await sucursalImpuestosService.remove(si.id!);
          toastx.success('Impuesto quitado correctamente');
          refresh();
        } catch (err) {
          toastx.error(getErrorMessage(err));
          quitarBtn.disabled = false;
          quitarBtn.textContent = 'Quitar';
        }
      });
      tdAcciones.appendChild(quitarBtn);

      tr.appendChild(tdNombre);
      tr.appendChild(tdPorcentaje);
      tr.appendChild(tdObligatorio);
      tr.appendChild(tdOrden);
      tr.appendChild(tdAcciones);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    return section;
  }

  private _buildAddSection(
    sucursal: Sucursales,
    assigned: SucursalImpuestosType[],
    refresh: () => void,
  ): HTMLElement {
    const section = document.createElement('div');

    const title = document.createElement('h3');
    title.style.cssText = 'font-size:15px;font-weight:600;margin:0 0 12px;color:#111827';
    title.textContent = 'Agregar impuesto';
    section.appendChild(title);

    const assignedIds = new Set(assigned.map(si => si.impuesto_id));
    const disponibles = this._impuestosAll.filter(i => !assignedIds.has(i.id));

    if (disponibles.length === 0) {
      const msg = document.createElement('p');
      msg.style.cssText = 'color:#6b7280;font-size:14px;padding:8px 0';
      msg.textContent = 'Todos los impuestos disponibles ya están asignados.';
      section.appendChild(msg);
      return section;
    }

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap';

    // Select impuesto
    const selectWrapper = document.createElement('div');
    selectWrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1;min-width:160px';
    const selectLabel = document.createElement('label');
    selectLabel.style.cssText = 'font-size:13px;font-weight:500;color:#374151';
    selectLabel.textContent = 'Impuesto *';
    const select = document.createElement('select');
    select.style.cssText = 'padding:7px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;background:#fff;color:#111827';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccionar...';
    select.appendChild(placeholder);
    disponibles.forEach(imp => {
      const opt = document.createElement('option');
      opt.value = String(imp.id);
      opt.textContent = `${imp.nombre ?? imp.id}${imp.porcentaje != null ? ` (${imp.porcentaje}%)` : ''}`;
      select.appendChild(opt);
    });
    selectWrapper.appendChild(selectLabel);
    selectWrapper.appendChild(select);

    // Checkbox obligatorio
    const checkWrapper = document.createElement('div');
    checkWrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px';
    const checkLabel = document.createElement('label');
    checkLabel.style.cssText = 'font-size:13px;font-weight:500;color:#374151';
    checkLabel.textContent = 'Obligatorio';
    const checkInput = document.createElement('input');
    checkInput.type = 'checkbox';
    checkInput.style.cssText = 'width:18px;height:18px;cursor:pointer;margin-top:6px';
    checkWrapper.appendChild(checkLabel);
    checkWrapper.appendChild(checkInput);

    // Orden aplicacion
    const ordenWrapper = document.createElement('div');
    ordenWrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px';
    const ordenLabel = document.createElement('label');
    ordenLabel.style.cssText = 'font-size:13px;font-weight:500;color:#374151';
    ordenLabel.textContent = 'Orden';
    const ordenInput = document.createElement('input');
    ordenInput.type = 'number';
    ordenInput.min = '0';
    ordenInput.value = String(assigned.length + 1);
    ordenInput.style.cssText = 'padding:7px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;width:80px';
    ordenWrapper.appendChild(ordenLabel);
    ordenWrapper.appendChild(ordenInput);

    // Botón agregar
    const agregarBtn = document.createElement('button');
    agregarBtn.className = 'btn btn-primary';
    agregarBtn.textContent = 'Agregar';
    agregarBtn.addEventListener('click', async () => {
      const impuestoId = Number(select.value);
      if (!impuestoId) {
        toastx.error('Selecciona un impuesto');
        return;
      }
      agregarBtn.disabled = true;
      agregarBtn.textContent = 'Agregando...';
      try {
        await sucursalImpuestosService.create({
          sucursal_id: sucursal.id!,
          impuesto_id: impuestoId,
          obligatorio: checkInput.checked,
          orden_aplicacion: Number(ordenInput.value) || 0,
        });
        toastx.success('Impuesto asignado correctamente');
        refresh();
      } catch (err) {
        toastx.error(getErrorMessage(err));
        agregarBtn.disabled = false;
        agregarBtn.textContent = 'Agregar';
      }
    });

    row.appendChild(selectWrapper);
    row.appendChild(checkWrapper);
    row.appendChild(ordenWrapper);
    row.appendChild(agregarBtn);
    section.appendChild(row);
    return section;
  }
}

// ---- Factory ----

export function Sucursales(container: HTMLElement): SucursalesFeature {
  const feature = new SucursalesFeature();
  feature.mount(container);
  return feature;
}
