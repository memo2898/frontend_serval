// ============================================
// Feature: OrdenLineas — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as ordenLineasService from './ordenlineas.service';
import { ordenLineasHeaders } from './datatable_config/ordenlineas.headers';
import { toOrdenLineasGridRows } from './datatable_config/ordenlineas.body';
import { getOrdenLineasFields } from './form_config/ordenlineas.fields';
import { buildDeleteBody } from './form_config/ordenlineas.delete';
import type { OrdenLineas, OrdenLineasCreateDTO } from './ordenlineas.types';
import * as ordenesService from '@/features/backoffice/ordenes/ordenes.service';
import * as articulosService from '@/features/backoffice/articulos/articulos.service';


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

export class OrdenLineasFeature {
  // State
  private _ordenLineas: OrdenLineas[] = [];
  private _saving = false;
  private _selectedOrdenLineas: OrdenLineas | null = null;
  private _ordenesOptions: Array<{ value: number; label: string }> = [];
  private _articulosOptions: Array<{ value: number; label: string }> = [];

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear OrdenLineas',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar OrdenLineas',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar OrdenLineas',
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
    pageTitle.textContent = 'OrdenLineas';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo OrdenLineas';
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
      id: 'ordenlineas-table',
      identityField: 'id',
      headers: ordenLineasHeaders,
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
      this._ordenLineas = filterExcluded(await ordenLineasService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [ordenesRaw, articulosRaw] = await Promise.all([
        ordenesService.getAll(),
        articulosService.getAll(),
      ]);
      this._ordenesOptions = filterExcluded(ordenesRaw).map((item: any) => ({
        value: item.id,
        label: item.sucursal_id ?? String(item.id),
      }));
      this._articulosOptions = filterExcluded(articulosRaw).map((item: any) => ({
        value: item.id,
        label: item.familia_id ?? String(item.id),
      }));
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: OrdenLineas): void {
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
      toOrdenLineasGridRows(this._ordenLineas, {
        onEdit:   (item) => this._openEdit(item),
        onDelete: (item) => this._openDelete(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedOrdenLineas = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: OrdenLineas): void {
    this._selectedOrdenLineas = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: OrdenLineas): void {
    this._selectedOrdenLineas = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: OrdenLineas | null, modal: ModalXInstance): HTMLElement {
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
          const data: OrdenLineasCreateDTO = {
            orden_id: result.body['orden_id'] as number,
            articulo_id: result.body['articulo_id'] as number,
            cantidad: result.body['cantidad'] as number,
            precio_unitario: result.body['precio_unitario'] as number,
            descuento_linea: result.body['descuento_linea'] as number,
            impuesto_linea: result.body['impuesto_linea'] as number,
            subtotal_linea: result.body['subtotal_linea'] as number,
            enviado_a_cocina: result.body['enviado_a_cocina'] as boolean,
            fecha_envio: result.body['fecha_envio'] as string,
            cuenta_num: result.body['cuenta_num'] as number,
            notas_linea: result.body['notas_linea'] as string,
          };

          if (isEdit) {
            await ordenLineasService.update(initialData.id!, data);
            toastx.success('OrdenLineas actualizado correctamente');
          } else {
            await ordenLineasService.create(data);
            toastx.success('OrdenLineas creado correctamente');
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
        ...getOrdenLineasFields(initialData, {
          ordenesOptions: this._ordenesOptions,
          articulosOptions: this._articulosOptions,
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
      if (!this._selectedOrdenLineas || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await ordenLineasService.remove(this._selectedOrdenLineas.id!);
        toastx.success('OrdenLineas eliminado correctamente');
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

export function OrdenLineas(container: HTMLElement): OrdenLineasFeature {
  const feature = new OrdenLineasFeature();
  feature.mount(container);
  return feature;
}
