// ============================================
// uiX - FormX Web Component
// ============================================

import type {
  ValidateOn,
  FormSubmitResult,
  FieldRegistration,
  FieldValidationResult,
} from "../../types";

// ---- Web Component ----

export class FormXElement extends HTMLElement {
  private _fields: Map<string, FieldRegistration> = new Map();
  private _onSubmitCallback?: (result: FormSubmitResult) => void;
  private _clickHandler: (e: Event) => void;

  constructor() {
    super();
    // Bind once so we can remove later
    this._clickHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-submitx]")) {
        e.preventDefault();
        this.submit();
      }
    };
  }

  static get observedAttributes() {
    return ["validate-on"];
  }

  // ---- Public properties ----

  get validateOn(): ValidateOn {
    return (this.getAttribute("validate-on") as ValidateOn) ?? "blur";
  }

  set onSubmit(fn: (result: FormSubmitResult) => void) {
    this._onSubmitCallback = fn;
  }

  // ---- Field registry (called by child inputs) ----

  registerField(registration: FieldRegistration): void {
    this._fields.set(registration.name, registration);
  }

  unregisterField(name: string): void {
    this._fields.delete(name);
  }

  // ---- Lifecycle ----

  connectedCallback(): void {
    this.addEventListener("click", this._clickHandler);
  }

  disconnectedCallback(): void {
    this.removeEventListener("click", this._clickHandler);
    this._fields.clear();
  }

  // ---- Public API ----

  submit(): void {
    const result = this.validate();
    this._onSubmitCallback?.(result);
    this.dispatchEvent(
      new CustomEvent<FormSubmitResult>("formx-submit", {
        detail: result,
        bubbles: true,
      })
    );
  }

  reset(): void {
    this._fields.forEach((field) => field.clearError());
  }

  validate(): FormSubmitResult {
    const body: Record<string, unknown> = {};
    const validations_results: FieldValidationResult[] = [];
    let general_validation = true;

    this._fields.forEach((field, name) => {
      const value = field.getValue();
      body[name] = value;

      const result = field.validate();
      validations_results.push(result);

      if (!result.isValid) {
        general_validation = false;
        field.setError(result.errors);
      } else {
        field.clearError();
      }
    });

    return { general_validation, body, validations_results };
  }

  getValues(): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    this._fields.forEach((field, name) => {
      values[name] = field.getValue();
    });
    return values;
  }
}

if (!customElements.get("form-x")) {
  customElements.define("form-x", FormXElement);
}

// ---- Factory types ----

export interface FormXConfig {
  validateOn?: ValidateOn;
  onSubmit?: (result: FormSubmitResult) => void;
  className?: string;
  children?: HTMLElement[];
}

// ---- Factory function ----

export function FormX(config: FormXConfig = {}): FormXElement {
  const el = document.createElement("form-x") as FormXElement;

  if (config.validateOn) el.setAttribute("validate-on", config.validateOn);
  if (config.onSubmit)   el.onSubmit = config.onSubmit;
  if (config.className)  el.className = config.className;

  // Append children — they register with FormX when the tree
  // is mounted to the document (via connectedCallback)
  config.children?.forEach((child) => el.appendChild(child));

  return el;
}
