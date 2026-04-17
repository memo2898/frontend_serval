/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================
// uiX - DynamicFieldsX Component (Vanilla)
// ============================================

import {
  type FieldDefinition,
  type SimpleField,
  type ContractType,
  generateId,
  labelToName,
} from "./types";
import {
  type FieldRegistration,
  type FieldValidationResult,
  type SelectXOption,
  type ValidationRule,
} from "../../types";
import "./DynamicFieldsX.css";

// ============================================
// Config
// ============================================

export interface DynamicFieldsXConfig {
  name: string;
  contract: ContractType;
  value?: FieldDefinition[] | Record<string, any> | SimpleField[];
  onChange?: (value: any) => void;
  schema?: FieldDefinition[];
  extraFields?: SimpleField[];
  onExtraFieldsChange?: (fields: SimpleField[]) => void;
  optionsResolvers?: Record<string, SelectXOption[]>;
  disabled?: boolean;
  label?: string;
}

// ============================================
// SVG Icons
// ============================================

const ICON_DRAG = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
  <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
  <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
  <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
</svg>`;

const ICON_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

const ICON_DELETE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
</svg>`;

const ICON_ADD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
</svg>`;

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

// ============================================
// Constants
// ============================================

const COMPONENT_OPTIONS = [
  { value: "Input",    label: "Input (texto, número, email)" },
  { value: "Select",   label: "Select (lista desplegable)" },
  { value: "Checkbox", label: "Checkbox (sí/no)" },
  { value: "Date",     label: "Fecha" },
  { value: "Textarea", label: "Textarea (texto largo)" },
  { value: "File",     label: "Archivo" },
];

const INPUT_TYPE_OPTIONS = [
  { value: "text",     label: "Texto" },
  { value: "number",   label: "Número" },
  { value: "email",    label: "Email" },
  { value: "password", label: "Contraseña" },
];

const VALIDATION_OPTIONS = [
  { type: "required",  label: "Requerido",         hasValue: false },
  { type: "email",     label: "Email válido",       hasValue: false },
  { type: "minLength", label: "Longitud mínima",    hasValue: true },
  { type: "maxLength", label: "Longitud máxima",    hasValue: true },
  { type: "min",       label: "Valor mínimo",       hasValue: true },
  { type: "max",       label: "Valor máximo",       hasValue: true },
  { type: "pattern",   label: "Patrón (regex)",     hasValue: true },
];

const SIMPLE_TYPE_OPTIONS = [
  { value: "text",     label: "Texto" },
  { value: "number",   label: "Número" },
  { value: "checkbox", label: "Sí/No" },
];

// ============================================
// Utility helpers
// ============================================

function getSelectOptions(
  field: FieldDefinition,
  resolvers: Record<string, SelectXOption[]>
): SelectXOption[] {
  if (Array.isArray(field.options)) return field.options;
  if (typeof field.options === "string") return resolvers[field.options] ?? [];
  return [];
}

function mk(tag: string, cls?: string): HTMLElement {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}

// ============================================
// FieldCard builder (for define contract)
// ============================================

function buildFieldCard(
  field: FieldDefinition,
  index: number,
  isDragging: boolean,
  onEdit: () => void,
  onDelete: () => void,
  onDragStart: (i: number) => void,
  onDragOver: (e: DragEvent, i: number) => void,
  onDrop: (i: number) => void
): HTMLElement {
  const card = mk("div") as HTMLElement;
  card.className = `field-card${isDragging ? " dragging" : ""}`;
  card.draggable = true;

  card.addEventListener("dragstart", (e) => {
    (e as DragEvent).dataTransfer!.effectAllowed = "move";
    onDragStart(index);
  });
  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    (e as DragEvent).dataTransfer!.dropEffect = "move";
    card.classList.add("drag-over");
    onDragOver(e as DragEvent, index);
  });
  card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    onDrop(index);
  });

  // Drag handle
  const drag = mk("div", "field-card-drag");
  drag.innerHTML = ICON_DRAG;
  card.appendChild(drag);

  // Content
  const content = mk("div", "field-card-content");
  const header = mk("div", "field-card-header");
  const nameEl = mk("span", "field-card-name");
  nameEl.textContent = field.name;
  const typeEl = mk("span", "field-card-type");
  typeEl.textContent = field.component;
  header.append(nameEl, typeEl);
  const labelEl = mk("div", "field-card-label");
  labelEl.textContent = field.label;
  content.append(header, labelEl);

  const validations = field.rules?.validations ?? [];
  if (validations.length > 0) {
    const tagsRow = mk("div", "field-card-validations");
    validations.forEach((v) => {
      const tag = mk("span", "field-card-validation-tag");
      tag.textContent = v.value !== undefined ? `${v.type}: ${v.value}` : v.type;
      tagsRow.appendChild(tag);
    });
    content.appendChild(tagsRow);
  }
  card.appendChild(content);

  // Actions
  const actions = mk("div", "field-card-actions");
  const editBtn = mk("button", "field-card-action") as HTMLButtonElement;
  editBtn.type = "button";
  editBtn.title = "Editar";
  editBtn.innerHTML = ICON_EDIT;
  editBtn.addEventListener("click", onEdit);
  const delBtn = mk("button", "field-card-action delete") as HTMLButtonElement;
  delBtn.type = "button";
  delBtn.title = "Eliminar";
  delBtn.innerHTML = ICON_DELETE;
  delBtn.addEventListener("click", onDelete);
  actions.append(editBtn, delBtn);
  card.appendChild(actions);

  return card;
}

// ============================================
// SimpleFieldCard builder (for extend / none)
// ============================================

function buildSimpleFieldCard(
  field: SimpleField,
  index: number,
  isDragging: boolean,
  disabled: boolean,
  onValueChange: (i: number, v: any) => void,
  onDelete: (i: number) => void,
  onDragStart: (i: number) => void,
  onDrop: (i: number) => void
): HTMLElement {
  const card = mk("div", `simple-field-card${isDragging ? " dragging" : ""}`) as HTMLElement;
  card.draggable = true;

  card.addEventListener("dragstart", (e) => {
    (e as DragEvent).dataTransfer!.effectAllowed = "move";
    onDragStart(index);
  });
  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    card.classList.add("drag-over");
  });
  card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("drag-over");
    onDrop(index);
  });

  // Drag handle
  const drag = mk("div", "field-card-drag");
  drag.innerHTML = ICON_DRAG;
  card.appendChild(drag);

  // Content: label + inline value input
  const content = mk("div", "field-card-content");
  const labelEl = mk("span", "simple-field-label");
  labelEl.textContent = `${field.label}:`;
  const valueWrap = mk("div", "simple-field-value");

  if (field.input_type === "checkbox") {
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = Boolean(field.value);
    chk.disabled = disabled;
    chk.addEventListener("change", () => onValueChange(index, chk.checked));
    valueWrap.appendChild(chk);
  } else {
    const inp = document.createElement("input");
    inp.type = field.input_type === "number" ? "number" : "text";
    inp.value = field.value ?? "";
    inp.placeholder = "Valor";
    inp.disabled = disabled;
    inp.addEventListener("input", () => onValueChange(index, inp.value));
    valueWrap.appendChild(inp);
  }
  content.append(labelEl, valueWrap);
  card.appendChild(content);

  // Delete action
  if (!disabled) {
    const actions = mk("div", "field-card-actions");
    const delBtn = mk("button", "field-card-action delete") as HTMLButtonElement;
    delBtn.type = "button";
    delBtn.title = "Eliminar";
    delBtn.innerHTML = ICON_DELETE;
    delBtn.addEventListener("click", () => onDelete(index));
    actions.appendChild(delBtn);
    card.appendChild(actions);
  }

  return card;
}

// ============================================
// FollowField builder (renders one schema field)
// ============================================

function buildFollowField(
  field: FieldDefinition,
  currentValue: any,
  onChange: (name: string, value: any) => void,
  resolvers: Record<string, SelectXOption[]>,
  disabled: boolean
): HTMLElement {
  const isRequired = field.rules?.validations?.some((v) => v.type === "required") ?? false;
  const wrap = mk("div", "follow-field-wrapper");

  switch (field.component) {
    case "Input": {
      const lbl = mk("label", "follow-field-label") as HTMLLabelElement;
      lbl.textContent = field.label + (isRequired ? " *" : "");
      const inp = document.createElement("input");
      inp.type = field.type ?? "text";
      inp.className = "follow-field-input";
      inp.placeholder = field.placeholder ?? "";
      inp.value = currentValue ?? "";
      inp.disabled = disabled;
      inp.addEventListener("input", () => onChange(field.name, inp.value));
      wrap.append(lbl, inp);
      if (field.helperText) {
        const h = mk("small", "follow-field-helper");
        h.textContent = field.helperText;
        wrap.appendChild(h);
      }
      break;
    }
    case "Select": {
      const lbl = mk("label", "follow-field-label") as HTMLLabelElement;
      lbl.textContent = field.label + (isRequired ? " *" : "");
      const sel = document.createElement("select");
      sel.className = "follow-field-input";
      sel.disabled = disabled;
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = field.placeholder ?? "Seleccionar...";
      sel.appendChild(placeholder);
      getSelectOptions(field, resolvers).forEach((opt) => {
        const o = document.createElement("option");
        o.value = String(opt.value);
        o.textContent = opt.label;
        if (opt.value === currentValue) o.selected = true;
        sel.appendChild(o);
      });
      if (currentValue && typeof currentValue === "string") sel.value = currentValue;
      sel.addEventListener("change", () => onChange(field.name, sel.value));
      wrap.append(lbl, sel);
      if (field.helperText) {
        const h = mk("small", "follow-field-helper");
        h.textContent = field.helperText;
        wrap.appendChild(h);
      }
      break;
    }
    case "Checkbox": {
      const row = mk("div", "follow-field-checkbox-row");
      const chk = document.createElement("input");
      const chkId = `follow-chk-${field.name}`;
      chk.type = "checkbox";
      chk.id = chkId;
      chk.className = "field-form-checkbox";
      chk.checked = Boolean(currentValue);
      chk.disabled = disabled;
      chk.addEventListener("change", () => onChange(field.name, chk.checked));
      const lbl = mk("label", "field-form-checkbox-label") as HTMLLabelElement;
      lbl.htmlFor = chkId;
      lbl.textContent = field.label;
      row.append(chk, lbl);
      wrap.appendChild(row);
      if (field.helperText) {
        const h = mk("small", "follow-field-helper");
        h.textContent = field.helperText;
        wrap.appendChild(h);
      }
      break;
    }
    case "Date": {
      const lbl = mk("label", "follow-field-label") as HTMLLabelElement;
      lbl.textContent = field.label + (isRequired ? " *" : "");
      const inp = document.createElement("input");
      inp.type = "date";
      inp.className = "follow-field-input";
      inp.value = currentValue ?? "";
      inp.disabled = disabled;
      inp.addEventListener("change", () => onChange(field.name, inp.value));
      wrap.append(lbl, inp);
      if (field.helperText) {
        const h = mk("small", "follow-field-helper");
        h.textContent = field.helperText;
        wrap.appendChild(h);
      }
      break;
    }
    case "Textarea": {
      const lbl = mk("label", "follow-field-label") as HTMLLabelElement;
      lbl.textContent = field.label + (isRequired ? " *" : "");
      const ta = document.createElement("textarea");
      ta.className = "follow-field-input";
      ta.placeholder = field.placeholder ?? "";
      ta.rows = 4;
      ta.style.resize = "vertical";
      ta.value = currentValue ?? "";
      ta.disabled = disabled;
      ta.addEventListener("input", () => onChange(field.name, ta.value));
      wrap.append(lbl, ta);
      if (field.helperText) {
        const h = mk("small", "follow-field-helper");
        h.textContent = field.helperText;
        wrap.appendChild(h);
      }
      break;
    }
    case "File": {
      const lbl = mk("label", "follow-field-label") as HTMLLabelElement;
      lbl.textContent = field.label + (isRequired ? " *" : "");
      const inp = document.createElement("input");
      inp.type = "file";
      inp.className = "follow-field-input";
      if (field.accept) inp.accept = field.accept;
      if (field.multiple) inp.multiple = true;
      inp.disabled = disabled;
      inp.addEventListener("change", () => {
        const files = inp.files ? Array.from(inp.files) : [];
        onChange(field.name, files);
      });
      wrap.append(lbl, inp);
      if (field.helperText) {
        const h = mk("small", "follow-field-helper");
        h.textContent = field.helperText;
        wrap.appendChild(h);
      }
      break;
    }
  }

  return wrap;
}

// ============================================
// FieldMetadataForm builder
// ============================================

function buildFieldMetadataForm(
  fieldData: FieldDefinition | null,
  onSave: (field: FieldDefinition) => void,
  onCancel: () => void
): HTMLElement {
  // ---- Mutable state ----
  let component: string = fieldData?.component ?? "Input";
  let name  = fieldData?.name ?? "";
  let label = fieldData?.label ?? "";
  let placeholder = fieldData?.placeholder ?? "";
  let helperText  = fieldData?.helperText ?? "";
  let inputType: string = fieldData?.type ?? "text";
  let optionsType: "inline" | "reference" = Array.isArray(fieldData?.options)
    ? "inline"
    : typeof fieldData?.options === "string"
      ? "reference"
      : "inline";
  let inlineOptions: SelectXOption[] = Array.isArray(fieldData?.options)
    ? (fieldData.options as SelectXOption[]).map((o) => ({ ...o }))
    : [];
  let optionsRef: string = typeof fieldData?.options === "string" ? fieldData.options : "";
  let allowFreeText = fieldData?.allowFreeText ?? false;
  let accept   = fieldData?.accept ?? "";
  let multiple = fieldData?.multiple ?? false;
  let maxSize  = fieldData?.maxSize?.toString() ?? "";
  let maxFiles = fieldData?.maxFiles?.toString() ?? "";

  const validations: Record<string, { enabled: boolean; value?: string }> = {};
  fieldData?.rules?.validations?.forEach((v) => {
    validations[v.type] = { enabled: true, value: v.value?.toString() };
  });

  // ---- Root container ----
  const container = mk("div", "field-form-container");

  // ---- Header ----
  const header = mk("div", "field-form-header");
  const titleEl = mk("span", "field-form-title");
  titleEl.textContent = fieldData ? "Editar Campo" : "Agregar Campo";
  const closeBtn = mk("button", "field-form-close") as HTMLButtonElement;
  closeBtn.type = "button";
  closeBtn.innerHTML = ICON_CLOSE;
  closeBtn.addEventListener("click", onCancel);
  header.append(titleEl, closeBtn);
  container.appendChild(header);

  // ---- Body ----
  const body = mk("div", "field-form-body");
  container.appendChild(body);

  // -- Component selector --
  const rowComp = mk("div", "field-form-row full");
  const grpComp = mk("div", "field-form-group");
  const lblComp = mk("label", "field-form-label");
  lblComp.textContent = "Tipo de campo";
  const selComp = document.createElement("select");
  selComp.className = "field-form-select";
  COMPONENT_OPTIONS.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    if (opt.value === component) o.selected = true;
    selComp.appendChild(o);
  });
  selComp.addEventListener("change", () => {
    component = selComp.value;
    updateVisibility();
    updateValidationsGrid();
  });
  grpComp.append(lblComp, selComp);
  rowComp.appendChild(grpComp);
  body.appendChild(rowComp);

  // -- Label / Name --
  const rowLN = mk("div", "field-form-row");
  const grpLbl = mk("div", "field-form-group");
  const lblLbl = mk("label", "field-form-label");
  lblLbl.textContent = "Etiqueta *";
  const inpLbl = document.createElement("input");
  inpLbl.type = "text";
  inpLbl.className = "field-form-input";
  inpLbl.value = label;
  inpLbl.placeholder = "Ej: Correo Electrónico";
  inpLbl.addEventListener("input", () => {
    label = inpLbl.value;
    if (!fieldData) { name = labelToName(label); inpName.value = name; }
    refreshSaveBtn();
  });
  grpLbl.append(lblLbl, inpLbl);

  const grpName = mk("div", "field-form-group");
  const lblName = mk("label", "field-form-label");
  lblName.textContent = "Nombre (ID) *";
  const inpName = document.createElement("input");
  inpName.type = "text";
  inpName.className = "field-form-input";
  inpName.value = name;
  inpName.placeholder = "Ej: correo_electronico";
  inpName.addEventListener("input", () => { name = inpName.value; refreshSaveBtn(); });
  grpName.append(lblName, inpName);
  rowLN.append(grpLbl, grpName);
  body.appendChild(rowLN);

  // -- Placeholder / Helper --
  const rowPH = mk("div", "field-form-row");
  const grpPH1 = mk("div", "field-form-group");
  const lblPH1 = mk("label", "field-form-label");
  lblPH1.textContent = "Placeholder";
  const inpPH1 = document.createElement("input");
  inpPH1.type = "text"; inpPH1.className = "field-form-input";
  inpPH1.value = placeholder; inpPH1.placeholder = "Texto de ejemplo";
  inpPH1.addEventListener("input", () => { placeholder = inpPH1.value; });
  grpPH1.append(lblPH1, inpPH1);

  const grpPH2 = mk("div", "field-form-group");
  const lblPH2 = mk("label", "field-form-label");
  lblPH2.textContent = "Texto de ayuda";
  const inpPH2 = document.createElement("input");
  inpPH2.type = "text"; inpPH2.className = "field-form-input";
  inpPH2.value = helperText; inpPH2.placeholder = "Descripción adicional";
  inpPH2.addEventListener("input", () => { helperText = inpPH2.value; });
  grpPH2.append(lblPH2, inpPH2);
  rowPH.append(grpPH1, grpPH2);
  body.appendChild(rowPH);

  // -- Input type section --
  const inputTypeSection = mk("div", "field-form-row");
  const grpIT = mk("div", "field-form-group");
  const lblIT = mk("label", "field-form-label");
  lblIT.textContent = "Tipo de input";
  const selIT = document.createElement("select");
  selIT.className = "field-form-select";
  INPUT_TYPE_OPTIONS.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value; o.textContent = opt.label;
    if (opt.value === inputType) o.selected = true;
    selIT.appendChild(o);
  });
  selIT.addEventListener("change", () => {
    inputType = selIT.value;
    updateValidationsGrid();
  });
  grpIT.append(lblIT, selIT);
  inputTypeSection.appendChild(grpIT);
  body.appendChild(inputTypeSection);

  // -- Select section --
  const selectSection = mk("div");
  selectSection.style.display = "flex";
  selectSection.style.flexDirection = "column";
  selectSection.style.gap = "16px";

  const rowOT = mk("div", "field-form-row");
  const grpOT = mk("div", "field-form-group");
  const lblOT = mk("label", "field-form-label");
  lblOT.textContent = "Tipo de opciones";
  const selOT = document.createElement("select");
  selOT.className = "field-form-select";
  [{ value: "inline", label: "Inline (definir aquí)" }, { value: "reference", label: "Referencia externa" }].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value; o.textContent = opt.label;
    if (opt.value === optionsType) o.selected = true;
    selOT.appendChild(o);
  });
  selOT.addEventListener("change", () => {
    optionsType = selOT.value as "inline" | "reference";
    inlineEditorWrap.style.display = optionsType === "inline" ? "" : "none";
    refInputWrap.style.display     = optionsType === "reference" ? "" : "none";
  });
  grpOT.append(lblOT, selOT);

  const grpAFT = mk("div", "field-form-group");
  const aftRow = mk("div", "field-form-checkbox-row");
  (aftRow as HTMLElement).style.marginTop = "24px";
  const aftChk = document.createElement("input");
  aftChk.type = "checkbox"; aftChk.className = "field-form-checkbox";
  aftChk.checked = allowFreeText;
  aftChk.addEventListener("change", () => { allowFreeText = aftChk.checked; });
  const aftLbl = mk("label", "field-form-checkbox-label");
  aftLbl.textContent = "Permitir texto libre";
  aftRow.append(aftChk, aftLbl);
  grpAFT.appendChild(aftRow);
  rowOT.append(grpOT, grpAFT);
  selectSection.appendChild(rowOT);

  // Inline options editor
  const inlineEditorWrap = mk("div", "options-editor");
  inlineEditorWrap.style.display = optionsType === "inline" ? "" : "none";
  const optEdHdr = mk("div", "options-editor-header");
  const optEdTitle = mk("span", "options-editor-title");
  optEdTitle.textContent = "Opciones";
  const addOptBtn = mk("button", "options-editor-add") as HTMLButtonElement;
  addOptBtn.type = "button"; addOptBtn.textContent = "+ Agregar";
  addOptBtn.addEventListener("click", () => {
    inlineOptions.push({ value: "", label: "" });
    renderOptionsList();
  });
  optEdHdr.append(optEdTitle, addOptBtn);
  const optList = mk("div", "options-editor-list");
  const renderOptionsList = () => {
    optList.innerHTML = "";
    if (inlineOptions.length === 0) {
      const empty = mk("div");
      (empty as HTMLElement).style.cssText = "font-size:13px;color:#9ca3af;padding:8px 0";
      empty.textContent = "No hay opciones. Haz click en \"+ Agregar\" para crear una.";
      optList.appendChild(empty); return;
    }
    inlineOptions.forEach((opt, idx) => {
      const item = mk("div", "options-editor-item");
      const iv = document.createElement("input");
      iv.type = "text"; iv.value = String(opt.value); iv.placeholder = "Valor";
      iv.addEventListener("input", () => { inlineOptions[idx].value = iv.value; });
      const il = document.createElement("input");
      il.type = "text"; il.value = opt.label; il.placeholder = "Etiqueta";
      il.addEventListener("input", () => { inlineOptions[idx].label = il.value; });
      const rb = mk("button", "options-editor-remove") as HTMLButtonElement;
      rb.type = "button"; rb.innerHTML = ICON_CLOSE;
      rb.addEventListener("click", () => { inlineOptions.splice(idx, 1); renderOptionsList(); });
      item.append(iv, il, rb);
      optList.appendChild(item);
    });
  };
  renderOptionsList();
  inlineEditorWrap.append(optEdHdr, optList);
  selectSection.appendChild(inlineEditorWrap);

  // Reference input
  const refInputWrap = mk("div", "field-form-group");
  refInputWrap.style.display = optionsType === "reference" ? "" : "none";
  const lblRef = mk("label", "field-form-label");
  lblRef.textContent = "Nombre de referencia";
  const inpRef = document.createElement("input");
  inpRef.type = "text"; inpRef.className = "field-form-input";
  inpRef.value = optionsRef; inpRef.placeholder = "Ej: marcas, departamentos";
  inpRef.addEventListener("input", () => { optionsRef = inpRef.value; });
  const refHint = mk("small");
  (refHint as HTMLElement).style.cssText = "font-size:11px;color:#6b7280;margin-top:4px";
  refHint.textContent = "Asegúrese de pasar esta referencia en optionsResolvers";
  refInputWrap.append(lblRef, inpRef, refHint);
  selectSection.appendChild(refInputWrap);

  body.appendChild(selectSection);

  // -- File section --
  const fileSection = mk("div");
  fileSection.style.display = "flex";
  fileSection.style.flexDirection = "column";
  fileSection.style.gap = "16px";

  const rowF1 = mk("div", "field-form-row");
  const grpAccept = mk("div", "field-form-group");
  const lblAccept = mk("label", "field-form-label");
  lblAccept.textContent = "Tipos aceptados";
  const inpAccept = document.createElement("input");
  inpAccept.type = "text"; inpAccept.className = "field-form-input";
  inpAccept.value = accept; inpAccept.placeholder = "Ej: .pdf,.jpg,image/*";
  inpAccept.addEventListener("input", () => { accept = inpAccept.value; });
  grpAccept.append(lblAccept, inpAccept);

  const grpMS = mk("div", "field-form-group");
  const lblMS = mk("label", "field-form-label");
  lblMS.textContent = "Tamaño máximo (bytes)";
  const inpMS = document.createElement("input");
  inpMS.type = "number"; inpMS.className = "field-form-input";
  inpMS.value = maxSize; inpMS.placeholder = "Ej: 5242880 (5MB)";
  inpMS.addEventListener("input", () => { maxSize = inpMS.value; });
  grpMS.append(lblMS, inpMS);
  rowF1.append(grpAccept, grpMS);
  fileSection.appendChild(rowF1);

  const rowF2 = mk("div", "field-form-row");
  const grpMult = mk("div", "field-form-group");
  const multRow = mk("div", "field-form-checkbox-row");
  const multChk = document.createElement("input");
  multChk.type = "checkbox"; multChk.className = "field-form-checkbox";
  multChk.checked = multiple;
  const maxFilesWrap = mk("div", "field-form-group");
  multChk.addEventListener("change", () => {
    multiple = multChk.checked;
    maxFilesWrap.style.display = multiple ? "" : "none";
  });
  const multLbl = mk("label", "field-form-checkbox-label");
  multLbl.textContent = "Permitir múltiples archivos";
  multRow.append(multChk, multLbl);
  grpMult.appendChild(multRow);

  const lblMF = mk("label", "field-form-label");
  lblMF.textContent = "Máximo de archivos";
  const inpMF = document.createElement("input");
  inpMF.type = "number"; inpMF.className = "field-form-input";
  inpMF.value = maxFiles; inpMF.placeholder = "Ej: 5";
  inpMF.addEventListener("input", () => { maxFiles = inpMF.value; });
  maxFilesWrap.append(lblMF, inpMF);
  maxFilesWrap.style.display = multiple ? "" : "none";

  rowF2.append(grpMult, maxFilesWrap);
  fileSection.appendChild(rowF2);
  body.appendChild(fileSection);

  // -- Validations section --
  const validationsSection = mk("div", "validations-picker");
  const validTitle = mk("span", "validations-picker-title");
  validTitle.textContent = "Validaciones";
  validationsSection.appendChild(validTitle);
  const validGrid = mk("div", "validations-picker-grid");
  validationsSection.appendChild(validGrid);

  const updateValidationsGrid = () => {
    validGrid.innerHTML = "";
    VALIDATION_OPTIONS.forEach((v) => {
      if (component === "Select"   && ["minLength","maxLength","min","max","pattern","email"].includes(v.type)) return;
      if (component === "Textarea" && ["min","max","email"].includes(v.type)) return;
      if (component === "Date"     && ["minLength","maxLength","email","pattern"].includes(v.type)) return;
      if (inputType !== "email"  && v.type === "email") return;
      if (inputType !== "number" && ["min","max"].includes(v.type)) return;
      if (inputType === "number" && ["minLength","maxLength","pattern"].includes(v.type)) return;

      const st = validations[v.type];
      const isEnabled = st?.enabled ?? false;
      const curVal    = st?.value ?? "";

      const item = mk("div", `validation-item${isEnabled ? " active" : ""}`);
      const itemHdr = mk("div", "validation-item-header");
      const itemChk = document.createElement("input");
      itemChk.type = "checkbox"; itemChk.className = "validation-item-checkbox";
      itemChk.checked = isEnabled;
      const itemLbl = mk("span", "validation-item-label");
      itemLbl.textContent = v.label;
      itemHdr.append(itemChk, itemLbl);
      item.appendChild(itemHdr);

      const valInp = document.createElement("input");
      valInp.type = "text"; valInp.className = "validation-item-input";
      valInp.value = curVal; valInp.placeholder = "Valor";
      valInp.style.display = (v.hasValue && isEnabled) ? "" : "none";
      valInp.addEventListener("input", () => {
        validations[v.type] = { enabled: true, value: valInp.value };
      });

      itemChk.addEventListener("change", () => {
        validations[v.type] = { enabled: itemChk.checked, value: valInp.value };
        item.className = `validation-item${itemChk.checked ? " active" : ""}`;
        if (v.hasValue) valInp.style.display = itemChk.checked ? "" : "none";
      });
      item.appendChild(valInp);
      validGrid.appendChild(item);
    });
  };

  updateValidationsGrid();
  body.appendChild(validationsSection);

  // -- Actions row --
  const actionsRow = mk("div", "field-form-actions");
  const cancelBtn = mk("button", "field-form-btn cancel") as HTMLButtonElement;
  cancelBtn.type = "button"; cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", onCancel);
  const saveBtn = mk("button", "field-form-btn save") as HTMLButtonElement;
  saveBtn.type = "button";
  saveBtn.textContent = fieldData ? "Guardar cambios" : "Agregar campo";
  saveBtn.disabled = name.trim() === "" || label.trim() === "";
  saveBtn.addEventListener("click", handleSave);
  actionsRow.append(cancelBtn, saveBtn);
  body.appendChild(actionsRow);

  // ---- Helpers ----
  const refreshSaveBtn = () => {
    (saveBtn as HTMLButtonElement).disabled = name.trim() === "" || label.trim() === "";
  };

  const updateVisibility = () => {
    inputTypeSection.style.display  = component === "Input"    ? "" : "none";
    selectSection.style.display     = component === "Select"   ? "flex" : "none";
    fileSection.style.display       = component === "File"     ? "flex" : "none";
    validationsSection.style.display = ["Checkbox","File"].includes(component) ? "none" : "";
  };

  updateVisibility();
  setTimeout(() => inpLbl.focus(), 0);

  function handleSave() {
    const fieldValidations: ValidationRule[] = [];
    Object.entries(validations).forEach(([type, cfg]) => {
      if (!cfg.enabled) return;
      const rule: ValidationRule = { type: type as any };
      if (cfg.value) {
        rule.value = isNaN(Number(cfg.value)) ? cfg.value : Number(cfg.value);
      }
      fieldValidations.push(rule);
    });

    const newField: FieldDefinition = {
      id: fieldData?.id ?? generateId(),
      component: component as any,
      name: name.trim(),
      label: label.trim(),
      placeholder: placeholder || undefined,
      helperText:  helperText  || undefined,
    };

    if (component === "Input") newField.type = inputType as any;

    if (component === "Select") {
      newField.options = optionsType === "inline"
        ? inlineOptions.filter((o) => o.value && o.label)
        : optionsRef.trim() || undefined;
      newField.allowFreeText = allowFreeText;
    }

    if (component === "File") {
      if (accept)   newField.accept   = accept;
      if (multiple) newField.multiple = true;
      if (maxSize)  newField.maxSize  = Number(maxSize);
      if (maxFiles) newField.maxFiles = Number(maxFiles);
    }

    if (fieldValidations.length > 0) {
      newField.rules = { validations: fieldValidations };
    }

    onSave(newField);
  }

  return container;
}

// ============================================
// SimpleFieldForm builder
// ============================================

function buildSimpleFieldForm(
  onSave: (field: SimpleField) => void,
  onCancel: () => void
): HTMLElement {
  let label = "";
  let inputType: "text" | "number" | "checkbox" = "text";

  const container = mk("div", "field-form-container");

  const header = mk("div", "field-form-header");
  const titleEl = mk("span", "field-form-title");
  titleEl.textContent = "Agregar Campo Extra";
  const closeBtn = mk("button", "field-form-close") as HTMLButtonElement;
  closeBtn.type = "button"; closeBtn.innerHTML = ICON_CLOSE;
  closeBtn.addEventListener("click", onCancel);
  header.append(titleEl, closeBtn);
  container.appendChild(header);

  const body = mk("div", "field-form-body");

  const row = mk("div", "field-form-row");

  const grpLbl = mk("div", "field-form-group");
  const lblLbl = mk("label", "field-form-label");
  lblLbl.textContent = "Etiqueta *";
  const inpLbl = document.createElement("input");
  inpLbl.type = "text"; inpLbl.className = "field-form-input";
  inpLbl.placeholder = "Ej: Incluye cargador";
  inpLbl.addEventListener("input", () => {
    label = inpLbl.value;
    (saveBtn as HTMLButtonElement).disabled = label.trim() === "";
  });
  grpLbl.append(lblLbl, inpLbl);

  const grpType = mk("div", "field-form-group");
  const lblType = mk("label", "field-form-label");
  lblType.textContent = "Tipo";
  const selType = document.createElement("select");
  selType.className = "field-form-select";
  SIMPLE_TYPE_OPTIONS.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value; o.textContent = opt.label;
    selType.appendChild(o);
  });
  selType.addEventListener("change", () => {
    inputType = selType.value as "text" | "number" | "checkbox";
  });
  grpType.append(lblType, selType);
  row.append(grpLbl, grpType);
  body.appendChild(row);

  const actionsRow = mk("div", "field-form-actions");
  const cancelBtn = mk("button", "field-form-btn cancel") as HTMLButtonElement;
  cancelBtn.type = "button"; cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", onCancel);
  const saveBtn = mk("button", "field-form-btn save") as HTMLButtonElement;
  saveBtn.type = "button"; saveBtn.textContent = "Agregar";
  saveBtn.disabled = true;
  saveBtn.addEventListener("click", () => {
    const n = labelToName(label);
    onSave({
      id: generateId(),
      name: n,
      label,
      input_type: inputType,
      value: inputType === "checkbox" ? false : "",
    });
  });
  actionsRow.append(cancelBtn, saveBtn);
  body.appendChild(actionsRow);
  container.appendChild(body);

  setTimeout(() => inpLbl.focus(), 0);
  return container;
}

// ============================================
// Web Component: DynamicFieldsXElement
// ============================================

export class DynamicFieldsXElement extends HTMLElement {
  // -- Config state --
  private _name: string = "";
  private _contract: ContractType = "define";
  private _disabled: boolean = false;
  private _label?: string;
  private _schema: FieldDefinition[] = [];
  private _optionsResolvers: Record<string, SelectXOption[]> = {};

  // -- Data state --
  private _fields: FieldDefinition[]            = []; // define
  private _formData: Record<string, any>         = {}; // follow / extend
  private _extraFields: SimpleField[]            = []; // extend extras / none

  // -- UI state --
  private _showAddForm    = false;
  private _editingIndex: number | null = null;
  private _draggedIndex: number | null = null;

  // -- Callbacks --
  public onChange?: (value: any) => void;
  public onExtraFieldsChange?: (fields: SimpleField[]) => void;

  // -- DOM refs --
  private _body!: HTMLElement;
  private _formX: { registerField: (r: FieldRegistration) => void; unregisterField: (n: string) => void } | null = null;

  connectedCallback() {
    this.style.display = "block";

    this._body = mk("div", "dynamic-fields-container");
    this.appendChild(this._body);

    this._name     = this.getAttribute("name") ?? this._name;
    this._contract = (this.getAttribute("contract") as ContractType) ?? this._contract;
    this._disabled = this.hasAttribute("disabled");
    this._label    = this.getAttribute("label") ?? this._label;

    // Register with parent FormX
    const formX = this.closest("form-x") as any;
    if (formX?.registerField) {
      this._formX = formX;
      const registration: FieldRegistration = {
        name:       this._name,
        getValue:   () => this._getCurrentValue(),
        validate:   () => this._validate(),
        setError:   () => {},
        clearError: () => {},
      };
      formX.registerField(registration);
    }

    this._render();
  }

  disconnectedCallback() {
    this._formX?.unregisterField(this._name);
  }

  // ---- JS property setters ----

  set contract(v: ContractType) { this._contract = v; this._render(); }
  set disabled(v: boolean)      { this._disabled = v; this._render(); }
  set label(v: string)          { this._label = v;    this._render(); }
  set schema(v: FieldDefinition[]) { this._schema = v; this._render(); }
  set optionsResolvers(v: Record<string, SelectXOption[]>) { this._optionsResolvers = v; }

  set value(v: FieldDefinition[] | Record<string, any> | SimpleField[]) {
    switch (this._contract) {
      case "define":
        this._fields = (v as FieldDefinition[]).map((f) => ({ ...f }));
        break;
      case "follow":
      case "extend":
        this._formData = { ...(v as Record<string, any>) };
        break;
      case "none":
        this._extraFields = (v as SimpleField[]).map((f) => ({ ...f }));
        break;
    }
    this._render();
  }

  set extraFields(v: SimpleField[]) {
    this._extraFields = v.map((f) => ({ ...f }));
    this._render();
  }

  // ---- FormX integration ----

  private _getCurrentValue(): any {
    switch (this._contract) {
      case "define": return this._fields;
      case "follow": return this._formData;
      case "extend": {
        const extras: Record<string, any> = {};
        this._extraFields.forEach((f) => { extras[f.name] = f.value; });
        return { ...this._formData, _extras: extras };
      }
      case "none": {
        const data: Record<string, any> = {};
        this._extraFields.forEach((f) => { data[f.name] = f.value; });
        return data;
      }
    }
  }

  private _validate(): FieldValidationResult {
    const value = this._getCurrentValue();
    if (this._contract === "follow" || this._contract === "extend") {
      const errors: string[] = [];
      this._schema.forEach((field) => {
        const isRequired = field.rules?.validations?.some((v) => v.type === "required");
        if (isRequired) {
          const fv = this._formData[field.name];
          if (fv === undefined || fv === null || fv === "") {
            errors.push(`${field.label} es requerido`);
          }
        }
      });
      return { name: this._name, value, isValid: errors.length === 0, errors };
    }
    return { name: this._name, value, isValid: true, errors: [] };
  }

  // ---- Render ----

  private _render(): void {
    if (!this._body) return;
    this._body.innerHTML = "";

    if (this._label) {
      const lbl = mk("div", "dynamic-fields-label");
      lbl.textContent = this._label;
      this._body.appendChild(lbl);
    }

    switch (this._contract) {
      case "define": this._body.appendChild(this._renderDefine()); break;
      case "follow": this._body.appendChild(this._renderFollow()); break;
      case "extend": this._body.appendChild(this._renderExtend()); break;
      case "none":   this._body.appendChild(this._renderNone());   break;
      default: {
        const err = mk("div", "dynamic-fields-error");
        err.textContent = `Contrato no válido: ${this._contract}`;
        this._body.appendChild(err);
      }
    }
  }

  // ---- Define contract ----

  private _renderDefine(): HTMLElement {
    const list = mk("div", "dynamic-fields-list");

    this._fields.forEach((field, index) => {
      if (this._editingIndex === index) {
        list.appendChild(
          buildFieldMetadataForm(
            field,
            (updated) => {
              this._fields[index] = updated;
              this._editingIndex = null;
              this.onChange?.(this._fields);
              this._render();
            },
            () => { this._editingIndex = null; this._render(); }
          )
        );
      } else {
        list.appendChild(
          buildFieldCard(
            field, index,
            this._draggedIndex === index,
            () => { this._editingIndex = index; this._showAddForm = false; this._render(); },
            () => {
              this._fields.splice(index, 1);
              this.onChange?.(this._fields);
              this._render();
            },
            (i) => { this._draggedIndex = i; },
            (_e, _i) => {},
            (dropIndex) => {
              if (this._draggedIndex === null || this._draggedIndex === dropIndex) {
                this._draggedIndex = null; return;
              }
              const [moved] = this._fields.splice(this._draggedIndex, 1);
              this._fields.splice(dropIndex, 0, moved);
              this._draggedIndex = null;
              this.onChange?.(this._fields);
              this._render();
            }
          )
        );
      }
    });

    if (this._showAddForm) {
      list.appendChild(
        buildFieldMetadataForm(
          null,
          (newField) => {
            this._fields.push(newField);
            this._showAddForm = false;
            this.onChange?.(this._fields);
            this._render();
          },
          () => { this._showAddForm = false; this._render(); }
        )
      );
    }

    if (!this._showAddForm && this._editingIndex === null && !this._disabled) {
      const addBtn = mk("button", "dynamic-fields-add-btn") as HTMLButtonElement;
      addBtn.type = "button";
      addBtn.innerHTML = `${ICON_ADD} Agregar campo`;
      addBtn.addEventListener("click", () => { this._showAddForm = true; this._render(); });
      list.appendChild(addBtn);
    }

    return list;
  }

  // ---- Follow contract ----

  private _renderFollow(): HTMLElement {
    const list = mk("div", "dynamic-fields-list");
    this._schema.forEach((field) => {
      const wrapper = mk("div");
      wrapper.style.marginBottom = "0";
      wrapper.appendChild(
        buildFollowField(
          field,
          this._formData[field.name],
          (fieldName, value) => {
            this._formData[fieldName] = value;
            this.onChange?.(this._formData);
          },
          this._optionsResolvers,
          this._disabled
        )
      );
      list.appendChild(wrapper);
    });
    return list;
  }

  // ---- Extend contract ----

  private _renderExtend(): HTMLElement {
    const container = mk("div", "dynamic-fields-container");

    // Schema section
    if (this._schema.length > 0) {
      const section = mk("div", "dynamic-fields-section");
      const title = mk("div", "dynamic-fields-section-title");
      title.textContent = "Campos requeridos";
      section.appendChild(title);
      section.appendChild(this._renderFollow());
      container.appendChild(section);
    }

    // Extras section
    const extSection = mk("div", "dynamic-fields-section");
    const extTitle = mk("div", "dynamic-fields-section-title");
    extTitle.textContent = "Campos adicionales";
    extSection.appendChild(extTitle);

    const list = mk("div", "dynamic-fields-list");

    this._extraFields.forEach((field, index) => {
      list.appendChild(
        buildSimpleFieldCard(
          field, index,
          this._draggedIndex === index,
          this._disabled,
          (i, v) => {
            this._extraFields[i] = { ...this._extraFields[i], value: v };
            this.onExtraFieldsChange?.(this._extraFields);
          },
          (i) => {
            this._extraFields.splice(i, 1);
            this.onExtraFieldsChange?.(this._extraFields);
            this._render();
          },
          (i) => { this._draggedIndex = i; },
          (dropIndex) => {
            if (this._draggedIndex === null || this._draggedIndex === dropIndex) {
              this._draggedIndex = null; return;
            }
            const [moved] = this._extraFields.splice(this._draggedIndex, 1);
            this._extraFields.splice(dropIndex, 0, moved);
            this._draggedIndex = null;
            this.onExtraFieldsChange?.(this._extraFields);
            this._render();
          }
        )
      );
    });

    if (this._showAddForm) {
      list.appendChild(
        buildSimpleFieldForm(
          (newField) => {
            this._extraFields.push(newField);
            this._showAddForm = false;
            this.onExtraFieldsChange?.(this._extraFields);
            this._render();
          },
          () => { this._showAddForm = false; this._render(); }
        )
      );
    }

    if (!this._showAddForm && !this._disabled) {
      const addBtn = mk("button", "dynamic-fields-add-btn") as HTMLButtonElement;
      addBtn.type = "button";
      addBtn.innerHTML = `${ICON_ADD} Agregar campo extra`;
      addBtn.addEventListener("click", () => { this._showAddForm = true; this._render(); });
      list.appendChild(addBtn);
    }

    extSection.appendChild(list);
    container.appendChild(extSection);
    return container;
  }

  // ---- None contract ----

  private _renderNone(): HTMLElement {
    const list = mk("div", "dynamic-fields-list");

    this._extraFields.forEach((field, index) => {
      list.appendChild(
        buildSimpleFieldCard(
          field, index,
          this._draggedIndex === index,
          this._disabled,
          (i, v) => {
            this._extraFields[i] = { ...this._extraFields[i], value: v };
            this.onChange?.(this._getCurrentValue());
          },
          (i) => {
            this._extraFields.splice(i, 1);
            this.onChange?.(this._getCurrentValue());
            this._render();
          },
          (i) => { this._draggedIndex = i; },
          (dropIndex) => {
            if (this._draggedIndex === null || this._draggedIndex === dropIndex) {
              this._draggedIndex = null; return;
            }
            const [moved] = this._extraFields.splice(this._draggedIndex, 1);
            this._extraFields.splice(dropIndex, 0, moved);
            this._draggedIndex = null;
            this.onChange?.(this._getCurrentValue());
            this._render();
          }
        )
      );
    });

    if (this._showAddForm) {
      list.appendChild(
        buildSimpleFieldForm(
          (newField) => {
            this._extraFields.push(newField);
            this._showAddForm = false;
            this.onChange?.(this._getCurrentValue());
            this._render();
          },
          () => { this._showAddForm = false; this._render(); }
        )
      );
    }

    if (!this._showAddForm && !this._disabled) {
      const addBtn = mk("button", "dynamic-fields-add-btn") as HTMLButtonElement;
      addBtn.type = "button";
      addBtn.innerHTML = `${ICON_ADD} Agregar campo`;
      addBtn.addEventListener("click", () => { this._showAddForm = true; this._render(); });
      list.appendChild(addBtn);
    }

    return list;
  }
}

if (!customElements.get("dynamic-fields-x")) {
  customElements.define("dynamic-fields-x", DynamicFieldsXElement);
}

// ============================================
// Factory function
// ============================================

export function DynamicFieldsX(config: DynamicFieldsXConfig): DynamicFieldsXElement {
  const el = document.createElement("dynamic-fields-x") as DynamicFieldsXElement;

  // Set HTML attributes (read in connectedCallback)
  el.setAttribute("name", config.name);
  el.setAttribute("contract", config.contract);
  if (config.label)    el.setAttribute("label", config.label);
  if (config.disabled) el.setAttribute("disabled", "");

  // Set callbacks and resolvers (simple assignments, no _body needed)
  if (config.onChange)            el.onChange            = config.onChange;
  if (config.onExtraFieldsChange) el.onExtraFieldsChange = config.onExtraFieldsChange;

  // Pre-seed internal state before connectedCallback fires.
  // Setters call _render() which safely returns early if _body isn't set yet.
  // We also set _contract/_name directly so the value setter picks the right branch.
  (el as any)._name     = config.name;
  (el as any)._contract = config.contract;
  if (config.label)    (el as any)._label    = config.label;
  if (config.disabled) (el as any)._disabled = true;
  if (config.schema)           (el as any)._schema           = config.schema;
  if (config.optionsResolvers) (el as any)._optionsResolvers = config.optionsResolvers;

  if (config.value !== undefined) {
    switch (config.contract) {
      case "define":
        (el as any)._fields = (config.value as FieldDefinition[]).map((f) => ({ ...f }));
        break;
      case "follow":
      case "extend":
        (el as any)._formData = { ...(config.value as Record<string, any>) };
        break;
      case "none":
        (el as any)._extraFields = (config.value as SimpleField[]).map((f) => ({ ...f }));
        break;
    }
  }

  if (config.extraFields !== undefined) {
    (el as any)._extraFields = config.extraFields.map((f) => ({ ...f }));
  }

  return el;
}
