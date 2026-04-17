// ============================================
// Feature: Ordenes — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as ordenesService from './ordenes.service';
import { ordenesHeaders } from './datatable_config/ordenes.headers';
import { toOrdenesGridRows } from './datatable_config/ordenes.body';
import { getOrdenesFields } from './form_config/ordenes.fields';
import { buildDeleteBody } from './form_config/ordenes.delete';
import type { Ordenes, OrdenesCreateDTO } from './ordenes.types';
import * as sucursalesService from '@/features/backoffice/sucursales/sucursales.service';
import * as terminalesService from '@/features/backoffice/terminales/terminales.service';
import * as usuariosService from '@/features/backoffice/usuarios/usuarios.service';
import * as mesasService from '@/features/backoffice/mesas/mesas.service';
import * as clientesService from '@/features/backoffice/clientes/clientes.service';


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

export class OrdenesFeature {
  // State
  private _ordenes: Ordenes[] = [];
  private _saving = false;
  private _selectedOrdenes: Ordenes | null = null;
  private _sucursalesOptions: Array<{ value: number; label: string }> = [];
  private _terminalesOptions: Array<{ value: number; label: string }> = [];
  private _usuariosOptions: Array<{ value: number; label: string }> = [];
  private _mesasOptions: Array<{ value: number; label: string }> = [];
  private _clientesOptions: Array<{ value: number; label: string }> = [];

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear Ordenes',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar Ordenes',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar Ordenes',
      size: 'sm',
      onClose: () => this._modalDelete.close(),
    });
  }

  mount(container: HTMLElement): void {
    container.innerHTML = '';

    // --- Header ---
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px';

    const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'Ordenes';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo Ordenes';
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
      id: 'ordenes-table',
      identityField: 'id',
      headers: ordenesHeaders,
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
      this._ordenes = filterExcluded(await ordenesService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [sucursalesRaw, terminalesRaw, usuariosRaw, mesasRaw, clientesRaw] = await Promise.all([
        sucursalesService.getAll(),
        terminalesService.getAll(),
        usuariosService.getAll(),
        mesasService.getAll(),
        clientesService.getAll(),
      ]);
      this._sucursalesOptions = filterExcluded(sucursalesRaw).map((item: any) => ({
        value: item.id,
        label: item.empresa_id ?? String(item.id),
      }));
      this._terminalesOptions = filterExcluded(terminalesRaw).map((item: any) => ({
        value: item.id,
        label: item.sucursal_id ?? String(item.id),
      }));
      this._usuariosOptions = filterExcluded(usuariosRaw).map((item: any) => ({
        value: item.id,
        label: item.sucursal_id ?? String(item.id),
      }));
      this._mesasOptions = filterExcluded(mesasRaw).map((item: any) => ({
        value: item.id,
        label: item.zona_id ?? String(item.id),
      }));
      this._clientesOptions = filterExcluded(clientesRaw).map((item: any) => ({
        value: item.id,
        label: item.empresa_id ?? String(item.id),
      }));
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: Ordenes): void {
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
      toOrdenesGridRows(this._ordenes, {
        onEdit:   (item) => this._openEdit(item),
        onDelete: (item) => this._openDelete(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedOrdenes = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: Ordenes): void {
    this._selectedOrdenes = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: Ordenes): void {
    this._selectedOrdenes = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: Ordenes | null, modal: ModalXInstance): HTMLElement {
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
          const data: OrdenesCreateDTO = {
            sucursal_id: result.body['sucursal_id'] as number,
            terminal_id: result.body['terminal_id'] as number,
            usuario_id: result.body['usuario_id'] as number,
            mesa_id: result.body['mesa_id'] as number,
            cliente_id: result.body['cliente_id'] as number,
            turno_id: result.body['turno_id'] as number,
            tipo_servicio: result.body['tipo_servicio'] as string,
            numero_orden: result.body['numero_orden'] as number,
            descuento_total: result.body['descuento_total'] as number,
            subtotal: result.body['subtotal'] as number,
            impuestos_total: result.body['impuestos_total'] as number,
            total: result.body['total'] as number,
            notas: result.body['notas'] as string,
            fecha_apertura: result.body['fecha_apertura'] as string,
            fecha_cierre: result.body['fecha_cierre'] as string,
          };

          if (isEdit) {
            await ordenesService.update(initialData.id, data);
            toastx.success('Ordenes actualizado correctamente');
          } else {
            await ordenesService.create(data);
            toastx.success('Ordenes creado correctamente');
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
        ...getOrdenesFields(initialData, {
          sucursalesOptions: this._sucursalesOptions,
          terminalesOptions: this._terminalesOptions,
          usuariosOptions: this._usuariosOptions,
          mesasOptions: this._mesasOptions,
          clientesOptions: this._clientesOptions,
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
      if (!this._selectedOrdenes || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await ordenesService.remove(this._selectedOrdenes.id);
        toastx.success('Ordenes eliminado correctamente');
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
}

// ---- Factory ----

export function Ordenes(container: HTMLElement): OrdenesFeature {
  const feature = new OrdenesFeature();
  feature.mount(container);
  return feature;
}
