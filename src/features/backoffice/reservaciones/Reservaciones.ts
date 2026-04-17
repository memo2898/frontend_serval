// ============================================
// Feature: Reservaciones — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as reservacionesService from './reservaciones.service';
import { reservacionesHeaders } from './datatable_config/reservaciones.headers';
import { toReservacionesGridRows } from './datatable_config/reservaciones.body';
import { getReservacionesFields } from './form_config/reservaciones.fields';
import { buildDeleteBody } from './form_config/reservaciones.delete';
import type { Reservaciones, ReservacionesCreateDTO } from './reservaciones.types';
import * as sucursalesService from '@/features/backoffice/sucursales/sucursales.service';
import * as mesasService from '@/features/backoffice/mesas/mesas.service';
import * as clientesService from '@/features/backoffice/clientes/clientes.service';
import * as zonasService from '@/features/backoffice/zonas/zonas.service';
import type { Mesas } from '@/features/backoffice/mesas/mesas.types';
import type { Zonas } from '@/features/backoffice/zonas/zonas.types';


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

export class ReservacionesFeature {
  // State
  private _reservaciones: Reservaciones[] = [];
  private _saving = false;
  private _selectedReservaciones: Reservaciones | null = null;
  private _sucursalesOptions: Array<{ value: number; label: string }> = [];
  private _clientesOptions: Array<{ value: number; label: string }> = [];
  private _mesasRaw: Mesas[] = [];
  private _zonasRaw: Zonas[] = [];

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear Reservaciones',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar Reservaciones',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar Reservaciones',
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
    pageTitle.textContent = 'Reservaciones';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo Reservaciones';
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
      id: 'reservaciones-table',
      identityField: 'id',
      headers: reservacionesHeaders,
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
      this._reservaciones = filterExcluded(await reservacionesService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [sucursalesRaw, mesasRaw, clientesRaw, zonasRaw] = await Promise.all([
        sucursalesService.getAll(),
        mesasService.getAll(),
        clientesService.getAll(),
        zonasService.getAll(),
      ]);
      this._sucursalesOptions = filterExcluded(sucursalesRaw).map((item: any) => ({
        value: item.id,
        label: item.nombre ?? String(item.id),
      }));
      this._mesasRaw = filterExcluded(mesasRaw) as Mesas[];
      this._zonasRaw = filterExcluded(zonasRaw) as Zonas[];
      this._clientesOptions = filterExcluded(clientesRaw).map((item: any) => ({
        value: item.id,
        label: item.nombre ?? String(item.id),
      }));
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  private _getMesasForSucursal(sucursalId: number): Array<{ value: number; label: string }> {
    const zonaIds = new Set(
      this._zonasRaw
        .filter(z => z.sucursal_id === sucursalId)
        .map(z => z.id!),
    );
    return this._mesasRaw
      .filter(m => m.zona_id != null && zonaIds.has(m.zona_id!))
      .map(m => ({ value: m.id!, label: m.nombre ?? String(m.id) }));
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: Reservaciones): void {
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
      toReservacionesGridRows(this._reservaciones, {
        onEdit:   (item) => this._openEdit(item),
        onDelete: (item) => this._openDelete(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openCreate(): void {
    this._selectedReservaciones = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: Reservaciones): void {
    this._selectedReservaciones = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: Reservaciones): void {
    this._selectedReservaciones = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: Reservaciones | null, modal: ModalXInstance): HTMLElement {
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
          const toNum = (v: unknown) => v != null && v !== '' ? Number(v) : undefined;
          const data: ReservacionesCreateDTO = {
            sucursal_id: toNum(result.body['sucursal_id']),
            mesa_id: toNum(result.body['mesa_id']),
            cliente_id: toNum(result.body['cliente_id']),
            nombre_contacto: result.body['nombre_contacto'] as string,
            telefono: result.body['telefono'] as string,
            fecha_hora: result.body['fecha_hora'] as string,
            duracion_min: toNum(result.body['duracion_min']),
            num_personas: toNum(result.body['num_personas']),
            estado: (result.body['estado'] as string || 'pendiente') as ReservacionesCreateDTO['estado'],
            notas: result.body['notas'] as string,
            cancelada_en: result.body['cancelada_en'] as string,
            cancelada_por: toNum(result.body['cancelada_por']),
            motivo_cancelacion: result.body['motivo_cancelacion'] as string,
          };

          if (isEdit) {
            await reservacionesService.update(initialData.id, data);
            toastx.success('Reservaciones actualizado correctamente');
          } else {
            await reservacionesService.create(data);
            toastx.success('Reservaciones creado correctamente');
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
        ...getReservacionesFields(initialData, {
          sucursalesOptions: this._sucursalesOptions,
          mesasOptions: initialData?.sucursal_id != null
            ? this._getMesasForSucursal(initialData.sucursal_id)
            : [],
          clientesOptions: this._clientesOptions,
          onSucursalChange: (sucursalId, mesaEl) => {
            const sel = mesaEl as any;
            // Limpiar selección de mesa
            sel._selectedOption = null;
            sel._searchText = '';
            if (sel._inputEl) sel._inputEl.value = '';
            sel._updateClearBtn?.();

            if (sucursalId == null) {
              mesaEl.options = [];
              mesaEl.setAttribute('disabled', '');
              mesaEl.setAttribute('placeholder', 'Seleccione una sucursal primero');
            } else {
              mesaEl.options = this._getMesasForSucursal(sucursalId);
              mesaEl.removeAttribute('disabled');
              mesaEl.setAttribute('placeholder', 'Seleccionar...');
            }
          },
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
      if (!this._selectedReservaciones || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await reservacionesService.remove(this._selectedReservaciones.id);
        toastx.success('Reservaciones eliminado correctamente');
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

export function Reservaciones(container: HTMLElement): ReservacionesFeature {
  const feature = new ReservacionesFeature();
  feature.mount(container);
  return feature;
}
