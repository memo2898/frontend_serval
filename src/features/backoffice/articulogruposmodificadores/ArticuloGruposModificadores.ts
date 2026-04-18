// ============================================
// Feature: ArticuloGruposModificadores — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as articuloGruposModificadoresService from './articulogruposmodificadores.service';
import { articuloGruposModificadoresHeaders } from './datatable_config/articulogruposmodificadores.headers';
import { toArticuloGruposModificadoresGridRows } from './datatable_config/articulogruposmodificadores.body';
import { getArticuloGruposModificadoresFields } from './form_config/articulogruposmodificadores.fields';
import { buildDeleteBody } from './form_config/articulogruposmodificadores.delete';
import type { ArticuloGruposModificadores, ArticuloGruposModificadoresCreateDTO } from './articulogruposmodificadores.types';
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

export class ArticuloGruposModificadoresFeature {
  // State
  private _articuloGruposModificadores: ArticuloGruposModificadores[] = [];
  private _saving = false;
  private _selectedArticuloGruposModificadores: ArticuloGruposModificadores | null = null;
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
      title: 'Crear ArticuloGruposModificadores',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar ArticuloGruposModificadores',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar ArticuloGruposModificadores',
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
    pageTitle.textContent = 'ArticuloGruposModificadores';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo ArticuloGruposModificadores';
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
      id: 'articulogruposmodificadores-table',
      identityField: 'id',
      headers: articuloGruposModificadoresHeaders,
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
      this._articuloGruposModificadores = filterExcluded(await articuloGruposModificadoresService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [articulosRaw] = await Promise.all([
        articulosService.getAll(),
      ]);
      this._articulosOptions = filterExcluded(articulosRaw).map((item: any) => ({
        value: item.id,
        label: item.familia_id ?? String(item.id),
      }));
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: ArticuloGruposModificadores): void {
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
      toArticuloGruposModificadoresGridRows(this._articuloGruposModificadores, {
        onEdit:   (item) => this._openEdit(item),
        onDelete: (item) => this._openDelete(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedArticuloGruposModificadores = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: ArticuloGruposModificadores): void {
    this._selectedArticuloGruposModificadores = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: ArticuloGruposModificadores): void {
    this._selectedArticuloGruposModificadores = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: ArticuloGruposModificadores | null, modal: ModalXInstance): HTMLElement {
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
          const data: ArticuloGruposModificadoresCreateDTO = {
            articulo_id: result.body['articulo_id'] as number,
            grupo_modificador_id: result.body['grupo_modificador_id'] as number,
          };

          if (isEdit) {
            await articuloGruposModificadoresService.update(initialData.id!, data);
            toastx.success('ArticuloGruposModificadores actualizado correctamente');
          } else {
            await articuloGruposModificadoresService.create(data);
            toastx.success('ArticuloGruposModificadores creado correctamente');
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
        ...getArticuloGruposModificadoresFields(initialData, {
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
      if (!this._selectedArticuloGruposModificadores || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await articuloGruposModificadoresService.remove(this._selectedArticuloGruposModificadores.id!);
        toastx.success('ArticuloGruposModificadores eliminado correctamente');
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

export function ArticuloGruposModificadores(container: HTMLElement): ArticuloGruposModificadoresFeature {
  const feature = new ArticuloGruposModificadoresFeature();
  feature.mount(container);
  return feature;
}
