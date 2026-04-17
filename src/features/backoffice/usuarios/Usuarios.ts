// ============================================
// Feature: Usuarios — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as usuariosService from './usuarios.service';
import { usuariosHeaders } from './datatable_config/usuarios.headers';
import { toUsuariosGridRows } from './datatable_config/usuarios.body';
import { getUsuariosFields } from './form_config/usuarios.fields';
import { buildDeleteBody } from './form_config/usuarios.delete';
import type { Usuarios, UsuariosCreateDTO } from './usuarios.types';
import * as sucursalesService from '@/features/backoffice/sucursales/sucursales.service';
import * as rolesService from '@/features/backoffice/roles/roles.service';
import * as usuarioRolService from '@/features/backoffice/usuariorol/usuariorol.service';


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

export class UsuariosFeature {
  // State
  private _usuarios: Usuarios[] = [];
  private _saving = false;
  private _selectedUsuarios: Usuarios | null = null;
  private _sucursalesOptions: Array<{ value: number; label: string }> = [];
  private _rolesOptions: Array<{ value: number; label: string }> = [];

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;
  private readonly _modalRoles: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear Usuarios',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar Usuarios',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar Usuarios',
      size: 'sm',
      onClose: () => this._modalDelete.close(),
    });

    this._modalRoles = ModalX({
      title: 'Asignar Roles',
      size: 'md',
      onClose: () => this._modalRoles.close(),
    });
  }

  mount(container: HTMLElement): void {
    container.innerHTML = '';

    // --- Header ---
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px';

    const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'Usuarios';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo Usuarios';
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
      id: 'usuarios-table',
      identityField: 'id',
      headers: usuariosHeaders,
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
      this._usuarios = filterExcluded(await usuariosService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [sucursalesRaw, rolesRaw] = await Promise.all([
        sucursalesService.getAll(),
        rolesService.getAll(),
      ]);
      this._sucursalesOptions = filterExcluded(sucursalesRaw).map((item: any) => ({
        value: item.id,
        label: item.empresa_id ?? String(item.id),
      }));
      this._rolesOptions = filterExcluded(rolesRaw).map((item: any) => ({
        value: item.id,
        label: item.nombre ?? String(item.id),
      }));
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: Usuarios): void {
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
      toUsuariosGridRows(this._usuarios, {
        onEdit:   (item) => this._openEdit(item),
        onDelete: (item) => this._openDelete(item),
        onRoles:  (item) => this._openRoles(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedUsuarios = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: Usuarios): void {
    this._selectedUsuarios = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: Usuarios): void {
    this._selectedUsuarios = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  private async _openRoles(item: Usuarios): Promise<void> {
    this._selectedUsuarios = item;

    // Loader mientras carga
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'padding:24px;text-align:center;color:#6b7280';
    loadingDiv.textContent = 'Cargando roles...';
    this._modalRoles.setBody(loadingDiv);
    this._modalRoles.open();

    let allRoles: { id: number; nombre: string; descripcion: string }[] = [];
    try {
      allRoles = (await rolesService.getAll()) as typeof allRoles;
    } catch {
      toastx.error('No se pudieron cargar los roles');
      this._modalRoles.close();
      return;
    }

    // IDs de roles actuales del usuario
    const assignedIds = new Set<number>((item.roles ?? []).map((r) => r.id));

    // ---- Contenedor principal ----
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:16px';

    // Subtítulo
    const subtitle = document.createElement('p');
    subtitle.style.cssText = 'margin:0;font-size:14px;color:#6b7280';
    subtitle.textContent = `Usuario: ${item.nombre ?? ''} ${item.apellido ?? ''}`;
    wrapper.appendChild(subtitle);

    // Grid de cards
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:12px';

    const style = document.createElement('style');
    style.textContent = `
      .rol-card {
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.18s ease;
        background: #fff;
        user-select: none;
      }
      .rol-card:hover { border-color: #a78bfa; background: #faf5ff; }
      .rol-card.selected { border-color: #7c3aed; background: #f5f3ff; }
      .rol-card .rol-name {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .rol-card.selected .rol-name { color: #7c3aed; }
      .rol-card .rol-desc { font-size: 12px; color: #9ca3af; line-height: 1.4; }
      .rol-check {
        width: 18px; height: 18px; flex-shrink: 0;
        border: 2px solid #d1d5db; border-radius: 50%;
        display: inline-flex; align-items: center; justify-content: center;
        transition: all 0.18s;
      }
      .rol-card.selected .rol-check {
        background: #7c3aed; border-color: #7c3aed;
      }
    `;
    wrapper.appendChild(style);

    const selected = new Set<number>(assignedIds);

    allRoles.forEach((rol) => {
      const card = document.createElement('div');
      card.className = `rol-card${selected.has(rol.id) ? ' selected' : ''}`;

      card.innerHTML = `
        <div class="rol-name">
          <span class="rol-check">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" stroke-width="2">
              <polyline points="1.5 5 4 7.5 8.5 2.5"/>
            </svg>
          </span>
          ${rol.nombre}
        </div>
        <div class="rol-desc">${rol.descripcion}</div>
      `;

      card.addEventListener('click', () => {
        if (selected.has(rol.id)) {
          selected.delete(rol.id);
          card.classList.remove('selected');
        } else {
          selected.add(rol.id);
          card.classList.add('selected');
        }
      });

      grid.appendChild(card);
    });

    wrapper.appendChild(grid);
    this._modalRoles.setBody(wrapper);

    // Footer con acciones
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => this._modalRoles.close());

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Guardar';

    saveBtn.addEventListener('click', async () => {
      if (this._saving || !this._selectedUsuarios?.id) return;
      this._saving = true;
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      try {
        const userId = this._selectedUsuarios.id;
        const toAdd = [...selected].filter((id) => !assignedIds.has(id));
        const toRemove = [...assignedIds].filter((id) => !selected.has(id));

        await Promise.all([
          ...toAdd.map((rolId) => usuarioRolService.create({ usuario_id: userId, rol_id: rolId })),
          ...toRemove.map((rolId) => usuarioRolService.deleteCustom(userId, rolId)),
        ]);
        toastx.success('Roles actualizados correctamente');
        this._modalRoles.close();
        await this._fetch();
      } catch (err) {
        toastx.error(getErrorMessage(err));
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
      } finally {
        this._saving = false;
      }
    });

    this._modalRoles.setFooter([cancelBtn, saveBtn]);
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: Usuarios | null, modal: ModalXInstance): HTMLElement {
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
          const data: UsuariosCreateDTO = {
            sucursal_id: result.body['sucursal_id'] as number,
            rol_id: result.body['rol_id'] as number,
            nombre: result.body['nombre'] as string,
            apellido: result.body['apellido'] as string,
            username: result.body['username'] as string,
            pin: result.body['pin'] as string,
          };

          if (isEdit) {
            await usuariosService.update(initialData.id, data);
            toastx.success('Usuarios actualizado correctamente');
          } else {
            await usuariosService.create(data);
            toastx.success('Usuarios creado correctamente');
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
        ...getUsuariosFields(initialData, {
          sucursalesOptions: this._sucursalesOptions,
          rolesOptions: this._rolesOptions,
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
      if (!this._selectedUsuarios || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await usuariosService.remove(this._selectedUsuarios.id);
        toastx.success('Usuarios eliminado correctamente');
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

export function Usuarios(container: HTMLElement): UsuariosFeature {
  const feature = new UsuariosFeature();
  feature.mount(container);
  return feature;
}
