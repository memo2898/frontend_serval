// ============================================
// uiX - InputFileX Web Component
// ============================================

import "./InputFileX.css";
import type { FieldValidationResult } from "../../types";
import type { FormXElement } from "../FormX/FormX";

// ---- SVG Icons ----

const UPLOAD_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
</svg>`;

const IMAGE_ICON = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  <circle cx="8.5" cy="8.5" r="1.5"/>
  <path d="M21 15l-5-5L5 21"/>
</svg>`;

const FILE_ICON = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
  <path d="M13 2v7h7"/>
</svg>`;

const TRASH_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
</svg>`;

const ALERT_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" y1="8" x2="12" y2="12"/>
  <line x1="12" y1="16" x2="12.01" y2="16"/>
</svg>`;

// ---- Internal file wrapper ----

interface FileEntry {
  id: string;
  file: File;
  preview: string | null; // object URL for images
}

// ---- Utilities ----

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getAcceptLabel(accept: string): string {
  if (accept.includes("image/*")) return "Imágenes";
  if (accept.includes(".pdf"))    return "PDF";
  if (accept.includes("video/*")) return "Videos";
  return "Permitidos: " + accept;
}

function isFileAccepted(file: File, accept: string): boolean {
  const types   = accept.split(",").map((t) => t.trim());
  const ext     = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  const mime    = file.type;

  return types.some((t) => {
    if (t.startsWith("."))    return ext === t.toLowerCase();
    if (t.endsWith("/*"))     return mime.startsWith(t.split("/")[0] + "/");
    return mime === t;
  });
}

// ---- Web Component ----

export class InputFileXElement extends HTMLElement {
  // State
  private _files: FileEntry[]  = [];
  private _errors: string[]    = [];
  private _rendered            = false;

  // Config (JS properties)
  private _multiple  = false;
  private _maxFiles  = 10;
  private _maxSize   = 5 * 1024 * 1024; // 5 MB

  // DOM refs
  private _dropzoneEl:  HTMLDivElement | null   = null;
  private _fileInputEl: HTMLInputElement | null = null;
  private _filesListEl: HTMLDivElement | null   = null;
  private _errorEl:     HTMLDivElement | null   = null;
  private _helperEl:    HTMLDivElement | null   = null;

  static get observedAttributes() {
    return ["name", "label", "accept", "disabled", "helper-text", "required"];
  }

  // ---- JS Properties ----

  set multiple(v: boolean)  { this._multiple = v; }
  set maxFiles(v: number)   { this._maxFiles = v; }
  set maxSize(v: number)    { this._maxSize = v; }

  // ---- Lifecycle ----

  connectedCallback(): void {
    if (!this._rendered) {
      this._render();
      this._rendered = true;
    }

    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) {
      formX.registerField({
        name:       this.getAttribute("name") ?? "",
        // getValue always reads current _files at call time — no need to re-register on change
        getValue:   () => this._files.map((e) => e.file),
        validate:   () => this._runValidation(),
        setError:   (errors) => this._setErrors(errors),
        clearError: () => this._clearErrors(),
      });
    }
  }

  disconnectedCallback(): void {
    // Revoke all object URLs to free memory
    this._revokeAll();

    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) formX.unregisterField(this.getAttribute("name") ?? "");
  }

  attributeChangedCallback(attr: string, _old: string | null, value: string | null): void {
    if (!this._rendered) return;
    if (attr === "disabled") this._syncDisabled(value !== null);
  }

  // ---- Private: initial render ----

  private _render(): void {
    const name       = this.getAttribute("name")        ?? "";
    const label      = this.getAttribute("label")       ?? "";
    const accept     = this.getAttribute("accept")      ?? "";
    const disabled   = this.hasAttribute("disabled");
    const helperText = this.getAttribute("helper-text") ?? "";

    const container = document.createElement("div");
    container.className = "inputfilex-container";

    // Label
    if (label) {
      const labelEl = document.createElement("label");
      labelEl.className = "inputfilex-label";
      labelEl.textContent = label;
      if (this.hasAttribute("required")) labelEl.classList.add("required");
      container.appendChild(labelEl);
    }

    // Hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.name = name;
    fileInput.style.display = "none";
    if (accept)            fileInput.accept   = accept;
    if (this._multiple)    fileInput.multiple = true;
    if (disabled)          fileInput.disabled = true;
    fileInput.addEventListener("change", (e) => {
      this._handleFiles((e.target as HTMLInputElement).files);
      fileInput.value = ""; // reset so same file can be re-selected
    });
    this._fileInputEl = fileInput;
    container.appendChild(fileInput);

    // Dropzone
    const dropzone = document.createElement("div");
    dropzone.className = ["inputfilex-dropzone", disabled ? "disabled" : ""].filter(Boolean).join(" ");
    dropzone.addEventListener("click",      () => { if (!this.hasAttribute("disabled")) this._fileInputEl?.click(); });
    dropzone.addEventListener("dragenter",  (e) => this._onDragEnter(e));
    dropzone.addEventListener("dragover",   (e) => { e.preventDefault(); e.stopPropagation(); });
    dropzone.addEventListener("dragleave",  (e) => this._onDragLeave(e));
    dropzone.addEventListener("drop",       (e) => this._onDrop(e));

    // Dropzone content
    const content = document.createElement("div");
    content.className = "inputfilex-dropzone-content";
    content.innerHTML = `
      ${UPLOAD_ICON}
      <div class="inputfilex-dropzone-text">
        <span class="inputfilex-dropzone-primary">Click para seleccionar</span>
        <span class="inputfilex-dropzone-secondary">o arrastra archivos aquí</span>
      </div>
      ${accept ? `<span class="inputfilex-dropzone-hint">${getAcceptLabel(accept)}</span>` : ""}
    `;
    dropzone.appendChild(content);
    this._dropzoneEl = dropzone;
    container.appendChild(dropzone);

    // Files list
    const filesList = document.createElement("div");
    filesList.className = "inputfilex-files";
    filesList.style.display = "none";
    this._filesListEl = filesList;
    container.appendChild(filesList);

    // Error area
    const errorEl = document.createElement("div");
    errorEl.className = "inputfilex-error";
    errorEl.style.display = "none";
    this._errorEl = errorEl;
    container.appendChild(errorEl);

    // Helper
    if (helperText) {
      const helperEl = document.createElement("div");
      helperEl.className = "inputfilex-helper";
      helperEl.textContent = helperText;
      this._helperEl = helperEl;
      container.appendChild(helperEl);
    }

    this.appendChild(container);
  }

  // ---- Private: file handling ----

  private _handleFiles(fileList: FileList | null): void {
    if (!fileList || fileList.length === 0) return;
    const accept  = this.getAttribute("accept") ?? "";
    const errors: string[] = [];
    const valid:  FileEntry[] = [];

    Array.from(fileList).forEach((file) => {
      // maxFiles check
      if (!this._multiple && valid.length >= 1) {
        errors.push("Solo se permite un archivo");
        return;
      }
      if (this._multiple && this._files.length + valid.length >= this._maxFiles) {
        errors.push(`Máximo ${this._maxFiles} archivos permitidos`);
        return;
      }

      // Size check
      if (file.size > this._maxSize) {
        errors.push(`${file.name}: excede el tamaño máximo (${formatFileSize(this._maxSize)})`);
        return;
      }

      // Type check
      if (accept && !isFileAccepted(file, accept)) {
        errors.push(`${file.name}: tipo de archivo no permitido`);
        return;
      }

      const entry: FileEntry = {
        id:      Math.random().toString(36).slice(2),
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      };
      valid.push(entry);
    });

    if (errors.length > 0) {
      this._setErrors(errors);
      this.dispatchEvent(new CustomEvent("inputfilex-error", { detail: errors, bubbles: true }));
      return;
    }

    this._files = this._multiple ? [...this._files, ...valid] : valid;
    this._clearErrors();
    this._renderFilesList();

    this.dispatchEvent(new CustomEvent("inputfilex-change", {
      detail: this._files.map((e) => e.file),
      bubbles: true,
    }));
  }

  private _removeFile(id: string): void {
    const entry = this._files.find((e) => e.id === id);
    if (entry?.preview) URL.revokeObjectURL(entry.preview);

    this._files = this._files.filter((e) => e.id !== id);
    this._renderFilesList();

    this.dispatchEvent(new CustomEvent("inputfilex-change", {
      detail: this._files.map((e) => e.file),
      bubbles: true,
    }));
  }

  private _revokeAll(): void {
    this._files.forEach((e) => { if (e.preview) URL.revokeObjectURL(e.preview); });
  }

  // ---- Private: render files list ----

  private _renderFilesList(): void {
    const list = this._filesListEl!;

    if (this._files.length === 0) {
      list.style.display = "none";
      list.innerHTML = "";
      return;
    }

    list.style.display = "flex";
    list.innerHTML = "";
    const disabled = this.hasAttribute("disabled");

    this._files.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "inputfilex-file";

      // Preview
      const preview = document.createElement("div");
      preview.className = "inputfilex-file-preview";

      if (entry.preview) {
        const img = document.createElement("img");
        img.src = entry.preview;
        img.alt = entry.file.name;
        preview.appendChild(img);
      } else if (entry.file.type.startsWith("image/")) {
        preview.innerHTML = IMAGE_ICON;
      } else {
        preview.innerHTML = FILE_ICON;
      }
      item.appendChild(preview);

      // Info
      const info = document.createElement("div");
      info.className = "inputfilex-file-info";
      info.innerHTML = `
        <span class="inputfilex-file-name" title="${entry.file.name}">${entry.file.name}</span>
        <span class="inputfilex-file-size">${formatFileSize(entry.file.size)}</span>
      `;
      item.appendChild(info);

      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "inputfilex-file-remove";
      removeBtn.disabled = disabled;
      removeBtn.innerHTML = TRASH_ICON;
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._removeFile(entry.id);
      });
      item.appendChild(removeBtn);

      list.appendChild(item);
    });

    // Update dropzone error class based on current errors
    this._dropzoneEl?.classList.toggle("error", this._errors.length > 0);
  }

  // ---- Private: validation & error display ----

  private _runValidation(): FieldValidationResult {
    const name     = this.getAttribute("name") ?? "";
    const required = this.hasAttribute("required");
    const errors: string[] = [];

    if (required && this._files.length === 0) {
      errors.push("Este campo es requerido");
    }

    return { name, value: this._files.map((e) => e.file), isValid: errors.length === 0, errors };
  }

  private _setErrors(errors: string[]): void {
    this._errors = errors;
    this._updateErrorUI();
  }

  private _clearErrors(): void {
    this._errors = [];
    this._updateErrorUI();
  }

  private _updateErrorUI(): void {
    const errorEl   = this._errorEl!;
    const dropzone  = this._dropzoneEl!;
    const hasError  = this._errors.length > 0;

    dropzone.classList.toggle("error", hasError);

    if (hasError) {
      const items = this._errors.map((e) => `<li class="inputfilex-error-item">${e}</li>`).join("");
      errorEl.innerHTML = `${ALERT_ICON}<ul class="inputfilex-error-list">${items}</ul>`;
      errorEl.style.display = "flex";
      if (this._helperEl) this._helperEl.style.display = "none";
    } else {
      errorEl.innerHTML     = "";
      errorEl.style.display = "none";
      if (this._helperEl) this._helperEl.style.display = "";
    }
  }

  private _syncDisabled(disabled: boolean): void {
    if (this._fileInputEl) this._fileInputEl.disabled = disabled;
    if (this._dropzoneEl)  this._dropzoneEl.classList.toggle("disabled", disabled);
    // Re-render file list so remove buttons get disabled state updated
    if (this._filesListEl) this._renderFilesList();
  }

  // ---- Private: drag & drop ----

  private _onDragEnter(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (this.hasAttribute("disabled")) return;
    this._dropzoneEl?.classList.add("dragging");
  }

  private _onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    // Only stop dragging if we left the dropzone itself (not a child)
    if (this._dropzoneEl && !this._dropzoneEl.contains(e.relatedTarget as Node)) {
      this._dropzoneEl.classList.remove("dragging");
    }
  }

  private _onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this._dropzoneEl?.classList.remove("dragging");

    if (this.hasAttribute("disabled")) return;
    this._handleFiles(e.dataTransfer?.files ?? null);
  }

  // ---- Public API ----

  getFiles(): File[] {
    return this._files.map((e) => e.file);
  }

  clearFiles(): void {
    this._revokeAll();
    this._files = [];
    this._renderFilesList();
  }

  setError(errors: string[]): void  { this._setErrors(errors); }
  clearError(): void                { this._clearErrors(); }
  validate(): FieldValidationResult { return this._runValidation(); }
}

if (!customElements.get("input-file-x")) {
  customElements.define("input-file-x", InputFileXElement);
}

// ---- Factory types ----

export interface InputFileXConfig {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  helperText?: string;
  onChange?: (files: File[]) => void;
  onError?: (errors: string[]) => void;
}

// ---- Factory function ----

export function InputFileX(config: InputFileXConfig): InputFileXElement {
  const el = document.createElement("input-file-x") as InputFileXElement;

  el.setAttribute("name", config.name);
  if (config.label)     el.setAttribute("label",       config.label);
  if (config.accept)    el.setAttribute("accept",      config.accept);
  if (config.helperText)el.setAttribute("helper-text", config.helperText);
  if (config.required)  el.setAttribute("required",    "");
  if (config.disabled)  el.setAttribute("disabled",    "");

  // Complex config via JS properties
  if (config.multiple  !== undefined) el.multiple  = config.multiple;
  if (config.maxFiles  !== undefined) el.maxFiles  = config.maxFiles;
  if (config.maxSize   !== undefined) el.maxSize   = config.maxSize;

  if (config.onChange) {
    el.addEventListener("inputfilex-change", (e: Event) => {
      config.onChange!((e as CustomEvent<File[]>).detail);
    });
  }

  if (config.onError) {
    el.addEventListener("inputfilex-error", (e: Event) => {
      config.onError!((e as CustomEvent<string[]>).detail);
    });
  }

  return el;
}
