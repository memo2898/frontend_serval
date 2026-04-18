// ============================================
// Feature: GruposModificadores — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as gruposModificadoresService from './gruposmodificadores.service';
import * as modificadoresService from '../modificadores/modificadores.service';
import { gruposModificadoresHeaders } from './datatable_config/gruposmodificadores.headers';
import { toGruposModificadoresGridRows } from './datatable_config/gruposmodificadores.body';
import { modificadoresHeaders } from '../modificadores/datatable_config/modificadores.headers';
import { toModificadoresGridRows } from '../modificadores/datatable_config/modificadores.body';
import { getGruposModificadoresFields } from './form_config/gruposmodificadores.fields';
import { buildDeleteBody } from './form_config/gruposmodificadores.delete';
import { buildDeleteBody as buildModificadoresDeleteBody } from '../modificadores/form_config/modificadores.delete';
import { InputX } from '@/lib/uiX/components/InputX';
import type { GruposModificadores, GruposModificadoresCreateDTO } from './gruposmodificadores.types';
import type { Modificadores, ModificadoresCreateDTO } from '../modificadores/modificadores.types';


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

export class GruposModificadoresFeature {
  // State
  private _gruposModificadores: GruposModificadores[] = [];
  private _saving = false;
  private _selectedGruposModificadores: GruposModificadores | null = null;

  // State — sub-CRUD modificadores
  private _modificadoresDeGrupo: Modificadores[] = [];
  private _savingMod = false;
  private _selectedModificador: Modificadores | null = null;
  private _grupoActivo: GruposModificadores | null = null;
  private _modGridie!: Gridie;
  private _modLoadingEl!: HTMLElement;

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals — grupo
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;

  // Modals — modificadores del grupo
  private readonly _modalModificadores: ModalXInstance;
  private readonly _modalModCreate: ModalXInstance;
  private readonly _modalModEdit: ModalXInstance;
  private readonly _modalModDelete: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear GruposModificadores',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar GruposModificadores',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar GruposModificadores',
      size: 'sm',
      onClose: () => this._modalDelete.close(),
    });

    this._modalModificadores = ModalX({
      title: 'Modificadores del grupo',
      size: 'xl',
      onClose: () => this._modalModificadores.close(),
    });

    this._modalModCreate = ModalX({
      title: 'Nuevo Modificador',
      size: 'md',
      onClose: () => this._modalModCreate.close(),
    });

    this._modalModEdit = ModalX({
      title: 'Editar Modificador',
      size: 'md',
      onClose: () => this._modalModEdit.close(),
    });

    this._modalModDelete = ModalX({
      title: 'Eliminar Modificador',
      size: 'sm',
      onClose: () => this._modalModDelete.close(),
    });
  }

  mount(container: HTMLElement): void {
    container.innerHTML = '';

    // --- Header ---
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px';

    const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'GruposModificadores';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo GruposModificadores';
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
      id: 'gruposmodificadores-table',
      identityField: 'id',
      headers: gruposModificadoresHeaders,
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

    this._fetch();
  }

  // ---- Data ----

  private async _fetch(): Promise<void> {
    this._loadingEl.style.display = 'block';
    try {
      this._gruposModificadores = filterExcluded(await gruposModificadoresService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private _refreshGrid(): void {
    this._gridie.setBody(
      toGruposModificadoresGridRows(this._gruposModificadores, {
        onEdit:          (item) => this._openEdit(item),
        onDelete:        (item) => this._openDelete(item),
        onModificadores: (item) => this._openModificadores(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedGruposModificadores = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: GruposModificadores): void {
    this._selectedGruposModificadores = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
  }

  private _openDelete(item: GruposModificadores): void {
    this._selectedGruposModificadores = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: GruposModificadores | null, modal: ModalXInstance): HTMLElement {
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
          const rawMin = result.body['min_seleccion'] as string;
          const rawMax = result.body['max_seleccion'] as string;
          const data: GruposModificadoresCreateDTO = {
            nombre: result.body['nombre'] as string,
            tipo: result.body['tipo'] as string | undefined,
            seleccion: result.body['seleccion'] as string | undefined,
            obligatorio: result.body['obligatorio'] === 'true',
            min_seleccion: rawMin !== '' ? Number(rawMin) : undefined,
            max_seleccion: rawMax !== '' ? Number(rawMax) : undefined,
          };

          if (isEdit) {
            await gruposModificadoresService.update(initialData.id!, data);
            toastx.success('GruposModificadores actualizado correctamente');
          } else {
            await gruposModificadoresService.create(data);
            toastx.success('GruposModificadores creado correctamente');
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
        ...getGruposModificadoresFields(initialData),
        errorMsg,
        actions,
      ],
    });

    return form;
  }

  // ---- Modificadores del grupo ----

  private async _openModificadores(grupo: GruposModificadores): Promise<void> {
    this._grupoActivo = grupo;
    this._modalModificadores.setBody(this._buildModificadoresPanel());
    this._modalModificadores.open();
    await this._fetchModificadores();
  }

  private _buildModificadoresPanel(): HTMLElement {
    const panel = document.createElement('div');

    // Título del grupo
    const titulo = document.createElement('div');
    titulo.style.cssText = 'font-size:16px;font-weight:600;color:#7c3aed;margin-bottom:12px';
    titulo.textContent = `Modificadores — ${this._grupoActivo?.nombre ?? `Grupo #${this._grupoActivo?.id}`}`;
    panel.appendChild(titulo);

    // Header del panel
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo Modificador';
    btnNew.className = 'btn btn-success';
    btnNew.addEventListener('click', () => this._openModCreate());
    header.appendChild(btnNew);

    // Loading
    this._modLoadingEl = document.createElement('p');
    this._modLoadingEl.textContent = 'Cargando...';
    this._modLoadingEl.style.cssText = 'color:#6b7280;margin:8px 0;display:none';

    // Gridie de modificadores
    this._modGridie = new Gridie({
      id: `mod-grupo-${this._grupoActivo?.id}-table`,
      identityField: 'id',
      headers: modificadoresHeaders,
      body: [],
      enableSort: true,
      enableFilter: true,
      language: 'es',
      paging: {
        enabled: true,
        pageSize: { visible: true, default: 10, options: [10, 25, 50] },
        showInfo: true,
        navigation: { visible: true, showPrevNext: true, showFirstLast: true, maxButtons: 5 },
        position: 'bottom',
      },
    });

    panel.appendChild(header);
    panel.appendChild(this._modLoadingEl);
    panel.appendChild(this._modGridie);

    return panel;
  }

  private async _fetchModificadores(): Promise<void> {
    if (!this._grupoActivo) return;
    this._modLoadingEl.style.display = 'block';
    try {
      const todos = filterExcluded(await modificadoresService.getAll());
      this._modificadoresDeGrupo = todos.filter(m => m.grupo_modificador_id === this._grupoActivo!.id);
      this._refreshModGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._modLoadingEl.style.display = 'none';
    }
  }

  private _refreshModGrid(): void {
    this._modGridie.setBody(
      toModificadoresGridRows(this._modificadoresDeGrupo, {
        onEdit:   (item) => this._openModEdit(item),
        onDelete: (item) => this._openModDelete(item),
      }),
    );
  }

  private _openModCreate(): void {
    this._selectedModificador = null;
    this._modalModCreate.setBody(this._buildModForm(null, this._modalModCreate));
    this._modalModCreate.open();
  }

  private _openModEdit(item: Modificadores): void {
    this._selectedModificador = item;
    this._modalModEdit.setBody(this._buildModForm(item, this._modalModEdit));
    this._modalModEdit.open();
  }

  private _openModDelete(item: Modificadores): void {
    this._selectedModificador = item;
    this._modalModDelete.setBody(buildModificadoresDeleteBody(item));
    this._modalModDelete.setFooter(this._buildModDeleteFooter());
    this._modalModDelete.open();
  }

  private _buildModForm(initialData: Modificadores | null, modal: ModalXInstance): HTMLElement {
    const isEdit = initialData !== null;
    const grupoId = this._grupoActivo?.id;

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

    // Campo informativo del grupo (solo lectura)
    const grupoInfo = document.createElement('div');
    grupoInfo.style.cssText = 'padding:8px 12px;background:#f5f3ff;border:1px solid #ede9fe;border-radius:6px;color:#7c3aed;font-size:14px;margin-bottom:8px';
    grupoInfo.textContent = `Grupo: ${this._grupoActivo?.nombre ?? `#${grupoId}`}`;

    const form = FormX({
      validateOn: 'blur',
      onSubmit: async (result) => {
        if (!result.general_validation) {
          errorMsg.style.display = 'flex';
          return;
        }
        errorMsg.style.display = 'none';
        if (this._savingMod) return;
        this._savingMod = true;
        submitBtn.disabled = true;
        cancelBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          const data: ModificadoresCreateDTO = {
            grupo_modificador_id: grupoId,
            nombre: result.body['nombre'] as string,
            precio_extra: result.body['precio_extra'] !== '' ? Number(result.body['precio_extra']) : undefined,
            orden_visual: result.body['orden_visual'] !== '' ? Number(result.body['orden_visual']) : undefined,
          };

          if (isEdit) {
            await modificadoresService.update(initialData.id!, data);
            toastx.success('Modificador actualizado correctamente');
          } else {
            await modificadoresService.create(data);
            toastx.success('Modificador creado correctamente');
          }

          modal.close();
          await this._fetchModificadores();
        } catch (err) {
          toastx.error(getErrorMessage(err));
          submitBtn.disabled = false;
          cancelBtn.disabled = false;
          submitBtn.textContent = isEdit ? 'Actualizar' : 'Crear';
        } finally {
          this._savingMod = false;
        }
      },
      children: [
        grupoInfo,
        ...this._buildModFields(initialData),
        errorMsg,
        actions,
      ],
    });

    return form;
  }

  private _buildModFields(initialData: Modificadores | null): HTMLElement[] {
    return [
      InputX({
        name: 'nombre',
        label: 'Nombre',
        placeholder: 'Ingrese nombre',
        type: 'text',
        defaultValue: initialData?.nombre != null ? String(initialData.nombre) : '',
        rules: { validations: [{ type: 'maxLength', value: 255 }] },
      }),
      InputX({
        name: 'precio_extra',
        label: 'Precio Extra',
        placeholder: 'Ingrese precio extra',
        type: 'number',
        defaultValue: initialData?.precio_extra != null ? String(initialData.precio_extra) : '',
        rules: { validations: [], restrictions: [{ type: 'onlyNumbers' }] },
      }),
      InputX({
        name: 'orden_visual',
        label: 'Orden Visual',
        placeholder: 'Ingrese orden visual',
        type: 'number',
        defaultValue: initialData?.orden_visual != null ? String(initialData.orden_visual) : '',
        rules: { validations: [], restrictions: [{ type: 'onlyNumbers' }] },
      }),
    ];
  }

  private _buildModDeleteFooter(): HTMLElement[] {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => this._modalModDelete.close());

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Eliminar';

    deleteBtn.addEventListener('click', async () => {
      if (!this._selectedModificador || this._savingMod) return;
      this._savingMod = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await modificadoresService.remove(this._selectedModificador.id!);
        toastx.success('Modificador eliminado correctamente');
        this._modalModDelete.close();
        await this._fetchModificadores();
      } catch (err) {
        toastx.error(getErrorMessage(err));
        deleteBtn.disabled = false;
        cancelBtn.disabled = false;
        deleteBtn.textContent = 'Eliminar';
      } finally {
        this._savingMod = false;
      }
    });

    return [cancelBtn, deleteBtn];
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
      if (!this._selectedGruposModificadores || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await gruposModificadoresService.remove(this._selectedGruposModificadores.id!);
        toastx.success('GruposModificadores eliminado correctamente');
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

export function GruposModificadores(container: HTMLElement): GruposModificadoresFeature {
  const feature = new GruposModificadoresFeature();
  feature.mount(container);
  return feature;
}
