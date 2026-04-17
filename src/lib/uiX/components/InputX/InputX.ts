// ============================================
// uiX - InputX Web Component
// ============================================

import "./InputX.css";
import type { InputRules, ValidateOn, FieldValidationResult } from "../../types";
import {
  validateField,
  shouldBlockKey,
  applyRestrictionsToValue,
  applyFormatting,
  getRawValue,
} from "../../utils";
import type { FormXElement } from "../FormX/FormX";

const ERROR_ICON_SVG = `<svg class="inputx-error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
</svg>`;

// ---- Web Component ----

export class InputXElement extends HTMLElement {
  // Internal state
  private _value = "";
  private _errors: string[] = [];
  private _touched = false;
  private _rules: InputRules = {};
  private _showSuccessState = false;
  private _rendered = false;

  // DOM refs
  private _inputEl: HTMLInputElement | null = null;
  private _labelEl: HTMLLabelElement | null = null;
  private _errorEl: HTMLDivElement | null = null;
  private _helperEl: HTMLSpanElement | null = null;

  static get observedAttributes() {
    return [
      "name", "label", "type", "placeholder",
      "disabled", "validate-on", "helper-text", "default-value",
    ];
  }

  // ---- JS Properties (for complex config set from factory) ----

  set rules(r: InputRules) {
    this._rules = r;
    if (this._rendered) {
      this._syncRequiredLabel();
    }
  }

  get rules(): InputRules {
    return this._rules;
  }

  set showSuccessState(val: boolean) {
    this._showSuccessState = val;
  }

  // Programmatically update the value (e.g. for pre-fill in edit forms)
  set value(val: string) {
    this._value = val;
    if (this._inputEl) this._inputEl.value = val;
  }

  get value(): string {
    return this._value;
  }

  // ---- Lifecycle ----

  connectedCallback(): void {
    if (!this._rendered) {
      this._render();
      this._rendered = true;
    }

    // Auto-register with parent <form-x>
    // connectedCallback fires in document order (parent before children),
    // so <form-x> is already connected and findable via closest().
    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) {
      formX.registerField({
        name: this.getAttribute("name") ?? "",
        getValue: () => this._getRawValue(),
        validate: () => this._runValidation(),
        setError: (errors) => this._setErrors(errors),
        clearError: () => this._clearErrors(),
      });
    }
  }

  disconnectedCallback(): void {
    // Unregister from parent form if still connected
    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) {
      formX.unregisterField(this.getAttribute("name") ?? "");
    }
  }

  attributeChangedCallback(
    attr: string,
    _old: string | null,
    value: string | null
  ): void {
    if (!this._rendered) return;

    switch (attr) {
      case "label":
        if (this._labelEl) this._labelEl.textContent = value ?? "";
        break;
      case "placeholder":
        if (this._inputEl) this._inputEl.placeholder = value ?? "";
        break;
      case "disabled":
        if (this._inputEl) this._inputEl.disabled = value !== null;
        break;
      case "default-value":
        this._value = value ?? "";
        if (this._inputEl) this._inputEl.value = this._value;
        break;
    }
  }

  // ---- Private: initial render ----

  private _render(): void {
    const name        = this.getAttribute("name") ?? "";
    const label       = this.getAttribute("label") ?? "";
    const type        = this.getAttribute("type") ?? "text";
    const placeholder = this.getAttribute("placeholder") ?? "";
    const disabled    = this.hasAttribute("disabled");
    const helperText  = this.getAttribute("helper-text") ?? "";
    const defaultVal  = this.getAttribute("default-value") ?? "";

    if (defaultVal) this._value = defaultVal;

    const container = document.createElement("div");
    container.className = "inputx-container";

    // Label
    if (label) {
      const labelEl = document.createElement("label");
      labelEl.htmlFor = name;
      labelEl.className = "inputx-label";
      labelEl.textContent = label;
      this._labelEl = labelEl;
      container.appendChild(labelEl);
    }

    // Wrapper + input
    const wrapper = document.createElement("div");
    wrapper.className = "inputx-wrapper";

    const input = document.createElement("input");
    input.id          = name;
    input.name        = name;
    input.type        = type;
    input.className   = "inputx-field";
    input.placeholder = placeholder;
    input.disabled    = disabled;
    input.value       = this._value;
    input.setAttribute("aria-invalid", "false");

    input.addEventListener("keydown", this._onKeyDown.bind(this));
    input.addEventListener("input",   this._onInput.bind(this));
    input.addEventListener("blur",    this._onBlur.bind(this));
    input.addEventListener("paste",   this._onPaste.bind(this));

    this._inputEl = input;
    wrapper.appendChild(input);
    container.appendChild(wrapper);

    // Error area (hidden by default)
    const errorEl = document.createElement("div");
    errorEl.className = "inputx-error";
    errorEl.id        = `${name}-error`;
    errorEl.setAttribute("role", "alert");
    errorEl.style.display = "none";
    this._errorEl = errorEl;
    container.appendChild(errorEl);

    // Helper text
    if (helperText) {
      const helperEl = document.createElement("span");
      helperEl.className   = "inputx-helper";
      helperEl.textContent = helperText;
      this._helperEl = helperEl;
      container.appendChild(helperEl);
    }

    this.appendChild(container);
    this._syncRequiredLabel();
  }

  // ---- Private: helpers ----

  private _syncRequiredLabel(): void {
    if (!this._labelEl) return;
    const isRequired =
      this._rules.validations?.some((v) => v.type === "required") ?? false;
    this._labelEl.classList.toggle("required", isRequired);
  }

  private _effectiveValidateOn(): ValidateOn {
    const own = this.getAttribute("validate-on") as ValidateOn | null;
    if (own) return own;
    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) return formX.validateOn;
    return "blur";
  }

  private _getRawValue(): string {
    const fmt = this._rules.formatting;
    if (fmt && fmt.length > 0) return getRawValue(this._value, fmt);
    return this._value;
  }

  private _runValidation(): FieldValidationResult {
    const name     = this.getAttribute("name") ?? "";
    const rawValue = this._getRawValue();
    const rules    = this._rules.validations;

    if (!rules || rules.length === 0) {
      return { name, value: rawValue, isValid: true, errors: [] };
    }
    return validateField(name, rawValue, rules);
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
    if (!this._inputEl || !this._errorEl) return;

    const hasError   = this._errors.length > 0;
    const showOK     = this._showSuccessState && this._touched && !hasError && this._value !== "";

    this._inputEl.classList.toggle("error",   hasError);
    this._inputEl.classList.toggle("success", showOK);
    this._inputEl.setAttribute("aria-invalid", String(hasError));

    if (hasError) {
      const items = this._errors
        .map((e) => `<li class="inputx-error-item">${e}</li>`)
        .join("");
      this._errorEl.innerHTML = `${ERROR_ICON_SVG}<ul class="inputx-error-list">${items}</ul>`;
      this._errorEl.style.display = "flex";
      if (this._helperEl) this._helperEl.style.display = "none";
    } else {
      this._errorEl.innerHTML      = "";
      this._errorEl.style.display  = "none";
      if (this._helperEl) this._helperEl.style.display = "";
    }
  }

  // ---- Private: event handlers ----

  private _onKeyDown(e: KeyboardEvent): void {
    const restrictions = this._rules.restrictions;
    if (!restrictions?.length) return;
    if (e.ctrlKey || e.metaKey) return;

    if (shouldBlockKey(e.key, this._value, restrictions)) {
      e.preventDefault();
    }
  }

  private _onInput(e: Event): void {
    let newValue = (e.target as HTMLInputElement).value;

    const restrictions = this._rules.restrictions;
    if (restrictions?.length) {
      newValue = applyRestrictionsToValue(newValue, restrictions);
    }

    const formatting = this._rules.formatting;
    if (formatting?.length) {
      newValue = applyFormatting(newValue, formatting);
    }

    this._value = newValue;

    // Sync back if formatting changed the value
    const inputEl = this._inputEl!;
    if (inputEl.value !== newValue) {
      const pos = inputEl.selectionStart ?? newValue.length;
      inputEl.value = newValue;
      try { inputEl.setSelectionRange(pos, pos); } catch { /* ignore */ }
    }

    const rawValue = this._getRawValue();
    this.dispatchEvent(
      new CustomEvent("inputx-change", { detail: { value: newValue, rawValue }, bubbles: true })
    );

    if (this._effectiveValidateOn() === "change") {
      this._touched = true;
      const result = this._runValidation();
      this._setErrors(result.isValid ? [] : result.errors);
    }
  }

  private _onBlur(): void {
    this._touched = true;
    const rawValue = this._getRawValue();

    this.dispatchEvent(
      new CustomEvent("inputx-blur", { detail: { value: this._value, rawValue }, bubbles: true })
    );

    if (this._effectiveValidateOn() === "blur") {
      const result = this._runValidation();
      this._setErrors(result.isValid ? [] : result.errors);
    }
  }

  private _onPaste(e: ClipboardEvent): void {
    const restrictions = this._rules.restrictions;
    if (!restrictions?.length) return;

    e.preventDefault();
    const pasted  = e.clipboardData?.getData("text") ?? "";
    const cleaned = applyRestrictionsToValue(pasted, restrictions);

    const inputEl = this._inputEl!;
    const start   = inputEl.selectionStart ?? 0;
    const end     = inputEl.selectionEnd   ?? 0;

    let newValue = this._value.slice(0, start) + cleaned + this._value.slice(end);

    const formatting = this._rules.formatting;
    if (formatting?.length) {
      newValue = applyFormatting(newValue, formatting);
    }

    this._value       = newValue;
    inputEl.value     = newValue;

    const rawValue = this._getRawValue();
    this.dispatchEvent(
      new CustomEvent("inputx-change", { detail: { value: newValue, rawValue }, bubbles: true })
    );
  }

  // ---- Public API (for external usage) ----

  getRawValue(): string {
    return this._getRawValue();
  }

  setError(errors: string[]): void {
    this._setErrors(errors);
  }

  clearError(): void {
    this._clearErrors();
  }

  validate(): FieldValidationResult {
    return this._runValidation();
  }
}

if (!customElements.get("input-x")) {
  customElements.define("input-x", InputXElement);
}

// ---- Factory types ----

export interface InputXConfig {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  validateOn?: ValidateOn;
  helperText?: string;
  showSuccessState?: boolean;
  defaultValue?: string;
  rules?: InputRules;
  onChange?: (value: string, rawValue: string) => void;
  onBlur?: (value: string, rawValue: string) => void;
}

// ---- Factory function ----

export function InputX(config: InputXConfig): InputXElement {
  const el = document.createElement("input-x") as InputXElement;

  el.setAttribute("name", config.name);
  if (config.label)        el.setAttribute("label",        config.label);
  if (config.type)         el.setAttribute("type",         config.type);
  if (config.placeholder)  el.setAttribute("placeholder",  config.placeholder);
  if (config.validateOn)   el.setAttribute("validate-on",  config.validateOn);
  if (config.helperText)   el.setAttribute("helper-text",  config.helperText);
  if (config.defaultValue) el.setAttribute("default-value", config.defaultValue);
  if (config.disabled)     el.setAttribute("disabled",     "");

  // Complex config via JS properties (not attributes)
  if (config.rules)             el.rules            = config.rules;
  if (config.showSuccessState)  el.showSuccessState = config.showSuccessState;

  // Event listeners
  if (config.onChange) {
    el.addEventListener("inputx-change", (e: Event) => {
      const { value, rawValue } = (e as CustomEvent<{ value: string; rawValue: string }>).detail;
      config.onChange!(value, rawValue);
    });
  }

  if (config.onBlur) {
    el.addEventListener("inputx-blur", (e: Event) => {
      const { value, rawValue } = (e as CustomEvent<{ value: string; rawValue: string }>).detail;
      config.onBlur!(value, rawValue);
    });
  }

  return el;
}
