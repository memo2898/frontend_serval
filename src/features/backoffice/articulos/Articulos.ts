// ============================================
// Feature: Articulos — CRUD (Vanilla TS)
// ============================================

import { Gridie } from '@/lib/gridie';
import { ModalXInstance, ModalX } from '@/lib/uiX/components/ModalX';
import { FormX } from '@/lib/uiX/components/FormX';
import { toastx } from '@/lib/uiX/components/ToastX';
import { filterExcluded } from '@/utils/filterExcluded';
import * as articulosService from './articulos.service';
import { articulosHeaders } from './datatable_config/articulos.headers';
import { toArticulosGridRows } from './datatable_config/articulos.body';
import { getArticulosFields } from './form_config/articulos.fields';
import { buildDeleteBody } from './form_config/articulos.delete';
import type { Articulos, ArticulosCreateDTO } from './articulos.types';
import * as familiasService from '@/features/backoffice/familias/familias.service';
import * as subfamiliasService from '@/features/backoffice/subfamilias/subfamilias.service';
import * as impuestosService from '@/features/backoffice/impuestos/impuestos.service';
import { uploadImage, deleteFile } from '@/features/backoffice/uploads/uploads.service';
import * as gruposModificadoresService from '@/features/backoffice/gruposmodificadores/gruposmodificadores.service';
import * as articuloGruposModificadoresService from '@/features/backoffice/articulogruposmodificadores/articulogruposmodificadores.service';


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

export class ArticulosFeature {
  // State
  private _articulos: Articulos[] = [];
  private _saving = false;
  private _selectedArticulos: Articulos | null = null;
  private _familiasOptions: Array<{ value: number; label: string }> = [];
  private _subfamiliasOptions: Array<{ value: number; label: string; familia_id?: number }> = [];
  private _impuestosOptions: Array<{ value: number; label: string }> = [];

  // DOM refs
  private _loadingEl!: HTMLElement;
  private _gridie!: Gridie;

  // Modals
  private readonly _modalCreate: ModalXInstance;
  private readonly _modalEdit: ModalXInstance;
  private readonly _modalDelete: ModalXInstance;
  private readonly _modalModificadores: ModalXInstance;

  constructor() {
    this._modalCreate = ModalX({
      title: 'Crear Articulos',
      size: 'md',
      onClose: () => this._modalCreate.close(),
    });

    this._modalEdit = ModalX({
      title: 'Editar Articulos',
      size: 'md',
      onClose: () => this._modalEdit.close(),
    });

    this._modalDelete = ModalX({
      title: 'Eliminar Articulos',
      size: 'sm',
      onClose: () => this._modalDelete.close(),
    });

    this._modalModificadores = ModalX({
      title: 'Grupos de Modificadores',
      size: 'md',
      onClose: () => this._modalModificadores.close(),
    });
  }

  mount(container: HTMLElement): void {
    container.innerHTML = '';

    // --- Header ---
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px';

    const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'Articulos';
    pageTitle.style.margin = '0';

    const btnNew = document.createElement('button');
    btnNew.textContent = '+ Nuevo Articulos';
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
      id: 'articulos-table',
      identityField: 'id',
      headers: articulosHeaders,
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
      this._articulos = filterExcluded(await articulosService.getAll());
      this._refreshGrid();
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      this._loadingEl.style.display = 'none';
    }
  }

  private async _fetchRelatedOptions(): Promise<void> {
    try {
      const [familiasRaw, subfamiliasRaw, impuestosRaw] = await Promise.all([
        familiasService.getAll(),
        subfamiliasService.getAll(),
        impuestosService.getAll(),
      ]);
      this._familiasOptions = filterExcluded(familiasRaw).map((item: any) => ({
        value: item.id,
        label: item.nombre ?? String(item.id),
      }));
      this._subfamiliasOptions = filterExcluded(subfamiliasRaw).map((item: any) => ({
        value: item.id,
        label: item.nombre ?? String(item.id),
        familia_id: item.familia_id,
      }));
      this._impuestosOptions = filterExcluded(impuestosRaw).map((item: any) => ({
        value: item.id,
        label: item.nombre ?? String(item.id),
      }));
    } catch (_err) {
      // Si falla la carga de opciones, se continúa sin ellas
    }
  }

  /** Pre-selecciona los SelectX de FK cuando se abre el modal de edición */
  private _preSelectFKValues(form: HTMLElement, data: Articulos): void {
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
      toArticulosGridRows(this._articulos, {
        onEdit:          (item) => this._openEdit(item),
        onDelete:        (item) => this._openDelete(item),
        onModificadores: (item) => this._openModificadores(item),
      }),
    );
  }

  // ---- Open modals ----

  private _openModificadores(item: Articulos): void {
    const titleEl = (this._modalModificadores as any)._container?.querySelector('.modal-title') as HTMLElement | null;
    if (titleEl) titleEl.textContent = `Modificadores — ${item.nombre ?? 'Artículo'}`;

    const container = document.createElement('div');
    container.style.cssText = 'min-height:120px';

    const loadingEl = document.createElement('p');
    loadingEl.textContent = 'Cargando grupos de modificadores...';
    loadingEl.style.cssText = 'color:#6b7280;margin:16px 0;text-align:center';
    container.appendChild(loadingEl);

    this._modalModificadores.setBody(container);
    this._modalModificadores.open();

    (async () => {
      try {
        const [grupos, todasRelaciones, todosModificadores] = await Promise.all([
          gruposModificadoresService.getAll(),
          articuloGruposModificadoresService.getAll(),
          import('@/features/backoffice/modificadores/modificadores.service').then(m => m.getAll()),
        ]);

        const asociados = new Set<number>(
          todasRelaciones
            .filter((r) => r.articulo_id === item.id)
            .map((r) => r.grupo_modificador_id as number)
            .filter((id) => id != null),
        );

        // Agrupar modificadores por grupo_modificador_id
        const modifPorGrupo = new Map<number, typeof todosModificadores>();
        todosModificadores.forEach((m: any) => {
          const gid = m.grupo_modificador_id as number;
          if (!modifPorGrupo.has(gid)) modifPorGrupo.set(gid, []);
          modifPorGrupo.get(gid)!.push(m);
        });

        loadingEl.remove();

        if (grupos.length === 0) {
          const empty = document.createElement('p');
          empty.textContent = 'No hay grupos de modificadores disponibles.';
          empty.style.cssText = 'color:#6b7280;text-align:center;margin:24px 0';
          container.appendChild(empty);
          return;
        }

        const styles = document.createElement('style');
        styles.textContent = `
          .modif-list { list-style:none; margin:0; padding:0; }
          .modif-item {
            border:1px solid #e5e7eb; border-radius:8px; margin-bottom:6px;
            overflow:hidden; background:#fff;
          }
          .modif-header {
            display:flex; align-items:center; gap:8px;
            padding:10px 12px; background:#f9fafb; cursor:default;
          }
          .modif-arrow-btn {
            display:flex; align-items:center; justify-content:center;
            width:24px; height:24px; flex-shrink:0;
            background:none; border:none; cursor:pointer; padding:0;
            color:#6b7280; border-radius:4px; transition:background 0.15s;
          }
          .modif-arrow-btn:hover { background:#e5e7eb; color:#374151; }
          .modif-arrow-btn svg {
            transition:transform 0.2s ease;
          }
          .modif-arrow-btn.open svg { transform:rotate(90deg); }
          .modif-info { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
          .modif-nombre { font-weight:600; font-size:14px; color:#111827; }
          .modif-meta { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-top:2px; }
          .modif-badge {
            font-size:11px; padding:2px 7px; border-radius:999px; font-weight:500; white-space:nowrap;
          }
          .badge-tipo-articulo   { background:#dbeafe; color:#1d4ed8; }
          .badge-tipo-comentario { background:#fef9c3; color:#854d0e; }
          .badge-unica    { background:#dcfce7; color:#166534; }
          .badge-multiple { background:#fae8ff; color:#86198f; }
          .badge-obligatorio { background:#fee2e2; color:#991b1b; }
          .modif-toggle-wrap { position:relative; flex-shrink:0; }
          .modif-toggle-input { opacity:0; width:0; height:0; position:absolute; }
          .modif-toggle-label {
            display:inline-block; width:40px; height:22px; background:#d1d5db;
            border-radius:999px; cursor:pointer; transition:background 0.2s; position:relative;
          }
          .modif-toggle-label::after {
            content:''; position:absolute; width:16px; height:16px; border-radius:50%;
            background:#fff; top:3px; left:3px; transition:left 0.2s;
            box-shadow:0 1px 3px rgba(0,0,0,0.2);
          }
          .modif-toggle-input:checked + .modif-toggle-label { background:#7c3aed; }
          .modif-toggle-input:checked + .modif-toggle-label::after { left:21px; }
          .modif-toggle-input:disabled + .modif-toggle-label { opacity:0.5; cursor:not-allowed; }
          .modif-panel {
            display:none; border-top:1px solid #e5e7eb;
            background:#fafafa; padding:8px 12px;
          }
          .modif-panel.open { display:block; }
          .modif-opciones { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:4px; }
          .modif-opcion {
            display:flex; align-items:center; justify-content:space-between;
            padding:5px 8px; border-radius:6px; font-size:13px; color:#374151;
            background:#fff; border:1px solid #e5e7eb;
          }
          .modif-opcion-nombre { font-weight:500; }
          .modif-opcion-precio {
            font-size:12px; color:#6b7280; white-space:nowrap;
          }
          .modif-opcion-precio.con-precio { color:#059669; font-weight:600; }
          .modif-panel-empty { font-size:13px; color:#9ca3af; font-style:italic; padding:4px 0; }
        `;
        container.appendChild(styles);

        const ul = document.createElement('ul');
        ul.className = 'modif-list';

        // Referencia al panel abierto actualmente (solo uno a la vez)
        let panelAbierto: { panel: HTMLElement; btn: HTMLElement } | null = null;

        grupos.forEach((grupo) => {
          if (!grupo.id) return;

          const li = document.createElement('li');
          li.className = 'modif-item';

          // ── Header del acordeón ──────────────────────────────────
          const header = document.createElement('div');
          header.className = 'modif-header';

          // Flecha
          const arrowBtn = document.createElement('button');
          arrowBtn.className = 'modif-arrow-btn';
          arrowBtn.type = 'button';
          arrowBtn.title = 'Ver opciones';
          arrowBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

          // Info
          const info = document.createElement('div');
          info.className = 'modif-info';

          const nombre = document.createElement('span');
          nombre.className = 'modif-nombre';
          nombre.textContent = grupo.nombre ?? `Grupo ${grupo.id}`;

          const meta = document.createElement('div');
          meta.className = 'modif-meta';

          const badgeTipo = document.createElement('span');
          badgeTipo.className = `modif-badge badge-tipo-${grupo.tipo ?? 'articulo'}`;
          badgeTipo.textContent = grupo.tipo ?? 'articulo';

          const badgeSel = document.createElement('span');
          badgeSel.className = `modif-badge badge-${grupo.seleccion ?? 'unica'}`;
          badgeSel.textContent = grupo.seleccion === 'multiple' ? 'múltiple' : 'única';

          meta.appendChild(badgeTipo);
          meta.appendChild(badgeSel);

          if (grupo.obligatorio) {
            const badgeObl = document.createElement('span');
            badgeObl.className = 'modif-badge badge-obligatorio';
            badgeObl.textContent = 'obligatorio';
            meta.appendChild(badgeObl);
          }

          info.appendChild(nombre);
          info.appendChild(meta);

          // Toggle asociar
          const toggleWrap = document.createElement('div');
          toggleWrap.className = 'modif-toggle-wrap';

          const toggleId = `modif-toggle-${item.id}-${grupo.id}`;
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.className = 'modif-toggle-input';
          input.id = toggleId;
          input.checked = asociados.has(grupo.id);

          const label = document.createElement('label');
          label.className = 'modif-toggle-label';
          label.htmlFor = toggleId;

          toggleWrap.appendChild(input);
          toggleWrap.appendChild(label);

          header.appendChild(arrowBtn);
          header.appendChild(info);
          header.appendChild(toggleWrap);

          // ── Panel desplegable ────────────────────────────────────
          const panel = document.createElement('div');
          panel.className = 'modif-panel';

          const opciones = modifPorGrupo.get(grupo.id) ?? [];
          const opcionesList = document.createElement('ul');
          opcionesList.className = 'modif-opciones';

          if (opciones.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'modif-panel-empty';
            empty.textContent = 'Sin opciones registradas.';
            panel.appendChild(empty);
          } else {
            opciones
              .slice()
              .sort((a: any, b: any) => (a.orden_visual ?? 0) - (b.orden_visual ?? 0))
              .forEach((op: any) => {
                const opLi = document.createElement('li');
                opLi.className = 'modif-opcion';

                const opNombre = document.createElement('span');
                opNombre.className = 'modif-opcion-nombre';
                opNombre.textContent = op.nombre ?? '—';

                const precioNum = parseFloat(op.precio_extra ?? '0');
                const opPrecio = document.createElement('span');
                opPrecio.className = precioNum > 0 ? 'modif-opcion-precio con-precio' : 'modif-opcion-precio';
                opPrecio.textContent = precioNum > 0 ? `+$${precioNum.toFixed(2)}` : 'sin costo';

                opLi.appendChild(opNombre);
                opLi.appendChild(opPrecio);
                opcionesList.appendChild(opLi);
              });
            panel.appendChild(opcionesList);
          }

          // ── Lógica del acordeón (solo uno abierto) ───────────────
          arrowBtn.addEventListener('click', () => {
            const yaEsteAbierto = panelAbierto?.panel === panel;

            // Cerrar el que está abierto
            if (panelAbierto) {
              panelAbierto.panel.classList.remove('open');
              panelAbierto.btn.classList.remove('open');
              panelAbierto = null;
            }

            // Abrir este si no era el mismo
            if (!yaEsteAbierto) {
              panel.classList.add('open');
              arrowBtn.classList.add('open');
              panelAbierto = { panel, btn: arrowBtn };
            }
          });

          // ── Toggle asociar ───────────────────────────────────────
          input.addEventListener('change', async () => {
            input.disabled = true;
            try {
              if (input.checked) {
                await articuloGruposModificadoresService.create({
                  articulo_id: item.id!,
                  grupo_modificador_id: grupo.id!,
                });
                asociados.add(grupo.id!);
                toastx.success(`"${grupo.nombre}" agregado`);
              } else {
                await articuloGruposModificadoresService.deleteCustom(item.id!, grupo.id!, 0);
                asociados.delete(grupo.id!);
                toastx.success(`"${grupo.nombre}" eliminado`);
              }
            } catch (err) {
              toastx.error(getErrorMessage(err));
              input.checked = !input.checked;
            } finally {
              input.disabled = false;
            }
          });

          li.appendChild(header);
          li.appendChild(panel);
          ul.appendChild(li);
        });

        container.appendChild(ul);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.textContent = 'Cerrar';
        closeBtn.style.cssText = 'margin-top:16px;width:100%';
        closeBtn.addEventListener('click', () => this._modalModificadores.close());
        container.appendChild(closeBtn);

      } catch (err) {
        loadingEl.textContent = '⚠ Error al cargar los grupos de modificadores.';
        loadingEl.style.color = '#dc2626';
        toastx.error(getErrorMessage(err));
      }
    })();
  }

  private _openCreate(): void {
    this._selectedArticulos = null;
    this._modalCreate.setBody(this._buildForm(null, this._modalCreate));
    this._modalCreate.open();
  }

  private _openEdit(item: Articulos): void {
    this._selectedArticulos = item;
    const editForm = this._buildForm(item, this._modalEdit);
    this._modalEdit.setBody(editForm);
    this._modalEdit.open();
    this._preSelectFKValues(editForm, item);
  }

  private _openDelete(item: Articulos): void {
    this._selectedArticulos = item;
    this._modalDelete.setBody(buildDeleteBody(item));
    this._modalDelete.setFooter(this._buildDeleteFooter());
    this._modalDelete.open();
  }

  // ---- Create / Edit form ----

  private _buildForm(initialData: Articulos | null, modal: ModalXInstance): HTMLElement {
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
          const imagenFiles = result.body['imagen'] as File[];
          const baseFields: Omit<ArticulosCreateDTO, 'imagen'> = {
            familia_id:    result.body['familia_id']    as number,
            subfamilia_id: result.body['subfamilia_id'] != null ? result.body['subfamilia_id'] as number : undefined,
            nombre:        result.body['nombre']        as string,
            descripcion:   result.body['descripcion']   as string | undefined,
            precio_venta:  parseFloat(result.body['precio_venta'] as string),
          };

          if (isEdit) {
            // ── Edición ────────────────────────────────────────────────
            let imagenUrl: string = initialData.imagen ?? '';

            if (imagenFiles && imagenFiles.length > 0) {
              // Eliminar imagen anterior si existe
              if (initialData.imagen) {
                const uploadsMarker = '/api/uploads/';
                const markerIdx = initialData.imagen.indexOf(uploadsMarker);
                if (markerIdx !== -1) {
                  const oldPath = initialData.imagen.slice(markerIdx + uploadsMarker.length);
                  await deleteFile(oldPath).catch(() => { /* ignorar si ya no existe */ });
                }
              }
              const uploaded = await uploadImage(`articulos/${initialData.id}/imagen`, imagenFiles[0]);
              imagenUrl = uploaded.url;
            }

            await articulosService.update(initialData.id!, { ...baseFields, imagen: imagenUrl });
            toastx.success('Articulos actualizado correctamente');
          } else {
            // ── Creación ───────────────────────────────────────────────
            // 1. Crear artículo para obtener el ID
            const created = await articulosService.create({ ...baseFields, imagen: '' });

            // 2. Subir imagen si se seleccionó una
            if (imagenFiles && imagenFiles.length > 0) {
              const uploaded = await uploadImage(`articulos/${created.id}/imagen`, imagenFiles[0]);
              await articulosService.update(created.id!, { imagen: uploaded.url });
            }

            toastx.success('Articulos creado correctamente');
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
        ...getArticulosFields(initialData, {
          familiasOptions: this._familiasOptions,
          subfamiliasOptions: this._subfamiliasOptions,
          impuestosOptions: this._impuestosOptions,
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
      if (!this._selectedArticulos || this._saving) return;
      this._saving = true;
      deleteBtn.disabled = true;
      cancelBtn.disabled = true;
      deleteBtn.textContent = 'Eliminando...';

      try {
        await articulosService.remove(this._selectedArticulos.id!);
        toastx.success('Articulos eliminado correctamente');
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

export function Articulos(container: HTMLElement): ArticulosFeature {
  const feature = new ArticulosFeature();
  feature.mount(container);
  return feature;
}
