// ============================================
// Feature: Empresas — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as empresasService from './empresas.service';
import { empresasHeaders } from './datatable_config/empresas.headers';
import { toEmpresasGridRows } from './datatable_config/empresas.body';
import { getEmpresasFields } from './form_config/empresas.fields';
import { buildDeleteBody } from './form_config/empresas.delete';
import type { Empresas } from './empresas.types';
import * as tipoDocumentosService from '@/features/backoffice/tipodocumentos/tipodocumentos.service';
import { uploadImage, deleteFile } from '@/features/backoffice/uploads/uploads.service';

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

export class EmpresasFeature {
  // State
  private _empresas: Empresas[] = [];
  private _saving = false;
  private _selectedEmpresas: Empresas | null = null;
  private _tipoDocumentosOptions: Array<{ value: number; label: string }> = [];

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear Empresas',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar Empresas',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar Empresas',
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
    pageTitle.textContent = 'Empresas';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo Empresas';
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
      id: 'empresas-table',
      identityField: 'id',
      headers: empresasHeaders,
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
      this._empresas = filterExcluded(await empresasService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [tipoDocumentosRaw] = await Promise.all([
        tipoDocumentosService.getAll(),
      ]);
      this._tipoDocumentosOptions = filterExcluded(tipoDocumentosRaw).map((item: any) => ({
        value: item.id,
        label: item.tipo ?? String(item.id),
      }));
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: Empresas): void {
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
      toEmpresasGridRows(this._empresas, {
        onEdit:   (item) => this._openEdit(item),
        onDelete: (item) => this._openDelete(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedEmpresas = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: Empresas): void {
    this._selectedEmpresas = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: Empresas): void {
    this._selectedEmpresas = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: Empresas | null, modal: ModalXInstance): HTMLElement {
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
      const logoFiles = result.body['logo'] as File[];
      const baseFields = {
        nombre:            result.body['nombre']            as string,
        tipo_documento_id: result.body['tipo_documento_id'] as number,
        numero_documento:  result.body['numero_documento']  as string,
      };

      if (isEdit) {
        // ── Edición ────────────────────────────────────────────────
        let logoUrl: string = initialData.logo ?? '';

        if (logoFiles && logoFiles.length > 0) {
          // Eliminar logo anterior si existe
          if (initialData.logo) {
            const uploadsMarker = '/api/uploads/';
            const markerIdx = initialData.logo.indexOf(uploadsMarker);
            if (markerIdx !== -1) {
              const oldPath = initialData.logo.slice(markerIdx + uploadsMarker.length);
              await deleteFile(oldPath).catch(() => { /* ignorar si ya no existe */ });
            }
          }
          const uploaded = await uploadImage(`empresas/${initialData.id}/logo`, logoFiles[0]);
          logoUrl = uploaded.url;
        }

        await empresasService.update(initialData.id!, { ...baseFields, logo: logoUrl });
        toastx.success('Empresa actualizada correctamente');
      } else {
        // ── Creación ───────────────────────────────────────────────
        // 1. Crear empresa para obtener el ID
        const created = await empresasService.create({ ...baseFields, logo: '', estado: '' });

        // 2. Subir logo si se seleccionó uno
        if (logoFiles && logoFiles.length > 0) {
          const uploaded = await uploadImage(`empresas/${created.id}/logo`, logoFiles[0]);
          await empresasService.update(created.id!, { logo: uploaded.url });
        }

        toastx.success('Empresa creada correctamente');
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
    ...getEmpresasFields(initialData, {
      tipoDocumentosOptions: this._tipoDocumentosOptions,
    }),
    errorMsg,
    actions,
  ],
});


//=========================
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
      if (!this._selectedEmpresas || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await empresasService.remove(this._selectedEmpresas.id!);
        toastx.success('Empresas eliminado correctamente');
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

export function Empresas(container: HTMLElement): EmpresasFeature {
  const feature = new EmpresasFeature();
  feature.mount(container);
  return feature;
}
