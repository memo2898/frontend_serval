// ============================================
// uiX - SelectX Web Component
// ============================================

import "./SelectX.css";
import type {
  InputRules,
  ValidateOn,
  FieldValidationResult,
  SelectXOption,
} from "../../types";
import { validateField, normalizedIncludes } from "../../utils";
import type { FormXElement } from "../FormX/FormX";

const ERROR_ICON_SVG = `<svg class="selectx-error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
</svg>`;

const CLEAR_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

const ARROW_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="6 9 12 15 18 9"/>
</svg>`;

// ---- Web Component ----

export class SelectXElement extends HTMLElement {
  // State
  private _isOpen = false;
  private _searchText = "";
  private _selectedOption: SelectXOption | null = null;
  private _highlightedIndex = -1;
  private _errors: string[] = [];
  private _rules: InputRules = {};
  private _options: SelectXOption[] = [];
  private _allowFreeText = false;
  private _rendered = false;

  // DOM refs
  private _inputEl: HTMLInputElement | null = null;
  private _dropdownEl: HTMLDivElement | null = null;
  private _clearBtnEl: HTMLButtonElement | null = null;
  private _arrowEl: HTMLDivElement | null = null;
  private _errorEl: HTMLDivElement | null = null;
  private _helperEl: HTMLSpanElement | null = null;
  private _labelEl: HTMLLabelElement | null = null;

  // Bound handlers (to remove cleanly)
  private _outsideClickHandler: (e: MouseEvent) => void;

  constructor() {
    super();
    this._outsideClickHandler = (e: MouseEvent) => {
      if (!this.contains(e.target as Node)) {
        this._closeDropdown();
        if (!this._allowFreeText && !this._selectedOption) {
          this._searchText = "";
          if (this._inputEl) this._inputEl.value = "";
        }
      }
    };
  }

  static get observedAttributes() {
    return ["name", "label", "placeholder", "disabled", "validate-on", "helper-text", "no-results-text"];
  }

  // ---- JS Properties ----

  set rules(r: InputRules) {
    this._rules = r;
    if (this._rendered) this._syncRequiredLabel();
  }
  get rules(): InputRules { return this._rules; }

  set options(opts: SelectXOption[]) {
    this._options = opts;
    if (this._isOpen && this._rendered) this._renderDropdownOptions();
  }
  get options(): SelectXOption[] { return this._options; }

  set allowFreeText(v: boolean) { this._allowFreeText = v; }

  // ---- Lifecycle ----

  connectedCallback(): void {
    if (!this._rendered) {
      this._render();
      this._rendered = true;
    }
    document.addEventListener("mousedown", this._outsideClickHandler);

    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) {
      formX.registerField({
        name: this.getAttribute("name") ?? "",
        getValue: () => this._getCurrentValue(),
        validate: () => this._runValidation(),
        setError: (errors) => this._setErrors(errors),
        clearError: () => this._clearErrors(),
      });
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener("mousedown", this._outsideClickHandler);
    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) formX.unregisterField(this.getAttribute("name") ?? "");
  }

  attributeChangedCallback(attr: string, _old: string | null, value: string | null): void {
    if (!this._rendered) return;
    if (attr === "label" && this._labelEl) this._labelEl.textContent = value ?? "";
    if (attr === "placeholder" && this._inputEl) this._inputEl.placeholder = value ?? "";
    if (attr === "disabled" && this._inputEl) this._inputEl.disabled = value !== null;
  }

  // ---- Private: render ----

  private _render(): void {
    const name        = this.getAttribute("name") ?? "";
    const label       = this.getAttribute("label") ?? "";
    const placeholder = this.getAttribute("placeholder") ?? "Seleccionar...";
    const disabled    = this.hasAttribute("disabled");
    const helperText  = this.getAttribute("helper-text") ?? "";

    const container = document.createElement("div");
    container.className = "selectx-container";

    // Label
    if (label) {
      const labelEl = document.createElement("label");
      labelEl.htmlFor = name;
      labelEl.className = "selectx-label";
      labelEl.textContent = label;
      this._labelEl = labelEl;
      container.appendChild(labelEl);
    }

    // Wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "selectx-input-wrapper";

    // Input
    const inputEl = document.createElement("input");
    inputEl.id = name;
    inputEl.type = "text";
    inputEl.className = "selectx-input";
    inputEl.placeholder = placeholder;
    inputEl.disabled = disabled;
    inputEl.autocomplete = "off";
    inputEl.setAttribute("aria-expanded", "false");
    inputEl.setAttribute("aria-haspopup", "listbox");
    inputEl.setAttribute("aria-invalid", "false");

    inputEl.addEventListener("input", this._onInput.bind(this));
    inputEl.addEventListener("focus", this._onFocus.bind(this));
    inputEl.addEventListener("blur",  this._onBlur.bind(this));
    inputEl.addEventListener("keydown", this._onKeyDown.bind(this));

    this._inputEl = inputEl;
    wrapper.appendChild(inputEl);

    // Icons
    const iconsEl = document.createElement("div");
    iconsEl.className = "selectx-icons";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "selectx-clear";
    clearBtn.tabIndex = -1;
    clearBtn.setAttribute("aria-label", "Limpiar selección");
    clearBtn.innerHTML = CLEAR_SVG;
    clearBtn.style.display = "none";
    clearBtn.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); });
    clearBtn.addEventListener("click", this._onClear.bind(this));
    this._clearBtnEl = clearBtn;
    iconsEl.appendChild(clearBtn);

    const arrowEl = document.createElement("div");
    arrowEl.className = "selectx-arrow";
    arrowEl.setAttribute("aria-label", "Abrir lista");
    arrowEl.innerHTML = ARROW_SVG;
    arrowEl.addEventListener("mousedown", (e) => { e.preventDefault(); e.stopPropagation(); });
    arrowEl.addEventListener("click", this._onArrowClick.bind(this));
    this._arrowEl = arrowEl;
    iconsEl.appendChild(arrowEl);


    wrapper.appendChild(iconsEl);

    // Dropdown (hidden initially)
    const dropdownEl = document.createElement("div");
    dropdownEl.className = "selectx-dropdown";
    dropdownEl.setAttribute("role", "listbox");
    dropdownEl.style.display = "none";
    this._dropdownEl = dropdownEl;
    wrapper.appendChild(dropdownEl);

    container.appendChild(wrapper);

    // Error area
    const errorEl = document.createElement("div");
    errorEl.className = "selectx-error";
    errorEl.setAttribute("role", "alert");
    errorEl.style.display = "none";
    this._errorEl = errorEl;
    container.appendChild(errorEl);

    // Helper text
    if (helperText) {
      const helperEl = document.createElement("span");
      helperEl.className = "selectx-helper";
      helperEl.textContent = helperText;
      this._helperEl = helperEl;
      container.appendChild(helperEl);
    }

    this.appendChild(container);
    this._syncRequiredLabel();
  }

  // ---- Private: dropdown ----

  private _openDropdown(): void {
    if (this.hasAttribute("disabled")) return;
    this._isOpen = true;
    this._highlightedIndex = -1;
    this._renderDropdownOptions();
    this._dropdownEl!.style.display = "block";
    this._inputEl!.classList.add("open");
    this._arrowEl!.classList.add("open");
    this._inputEl!.setAttribute("aria-expanded", "true");
  }

  private _closeDropdown(): void {
    this._isOpen = false;
    this._highlightedIndex = -1;
    this._dropdownEl!.style.display = "none";
    this._inputEl!.classList.remove("open");
    this._arrowEl!.classList.remove("open");
    this._inputEl!.setAttribute("aria-expanded", "false");
  }

  private _renderDropdownOptions(): void {
    if (!this._dropdownEl) return;
    const search = this._searchText;
    const filtered = search.trim()
      ? this._options.filter((o) => normalizedIncludes(o.label, search))
      : this._options;

    if (filtered.length === 0) {
      const noRes = this.getAttribute("no-results-text") ?? "No se encontraron resultados";
      this._dropdownEl.innerHTML = `<div class="selectx-no-results">${noRes}</div>`;
      return;
    }

    this._dropdownEl.innerHTML = "";
    filtered.forEach((option, index) => {
      const optEl = document.createElement("div");
      optEl.className = [
        "selectx-option",
        index === this._highlightedIndex ? "highlighted" : "",
        this._selectedOption?.value === option.value ? "selected" : "",
        option.disabled ? "disabled" : "",
      ].filter(Boolean).join(" ");
      optEl.textContent = option.label;
      optEl.setAttribute("role", "option");
      optEl.setAttribute("aria-selected", String(this._selectedOption?.value === option.value));
      if (option.disabled) optEl.setAttribute("aria-disabled", "true");

      optEl.addEventListener("mousedown", (e) => { e.preventDefault(); });
      optEl.addEventListener("click", () => { if (!option.disabled) this._selectOption(option); });

      this._dropdownEl!.appendChild(optEl);
    });
  }

  private _selectOption(option: SelectXOption): void {
    this._selectedOption = option;
    this._searchText = option.label;
    this._inputEl!.value = option.label;
    this._closeDropdown();
    this._errors = [];
    this._updateErrorUI();
    this._updateClearBtn();

    this.dispatchEvent(new CustomEvent("selectx-change", {
      detail: { value: option.value, option },
      bubbles: true,
    }));

    if (this._effectiveValidateOn() === "change") {
      const result = validateField(this.getAttribute("name") ?? "", option.value, this._rules.validations ?? []);
      this._setErrors(result.isValid ? [] : result.errors);
    }
  }

  // ---- Private: value & validation ----

  private _getCurrentValue(): string | number | null {
    if (this._selectedOption) return this._selectedOption.value;
    if (this._allowFreeText && this._searchText.trim()) return this._searchText.trim();
    return null;
  }

  private _runValidation(): FieldValidationResult {
    const name  = this.getAttribute("name") ?? "";
    const value = this._getCurrentValue();
    if (!this._rules.validations?.length) {
      return { name, value, isValid: true, errors: [] };
    }
    return validateField(name, value, this._rules.validations);
  }

  private _effectiveValidateOn(): ValidateOn {
    const own = this.getAttribute("validate-on") as ValidateOn | null;
    if (own) return own;
    const formX = this.closest("form-x") as FormXElement | null;
    if (formX) return formX.validateOn;
    return "blur";
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
    const hasError = this._errors.length > 0;
    this._inputEl.classList.toggle("error", hasError);
    this._inputEl.setAttribute("aria-invalid", String(hasError));

    if (hasError) {
      const items = this._errors.map((e) => `<li class="selectx-error-item">${e}</li>`).join("");
      this._errorEl.innerHTML = `${ERROR_ICON_SVG}<ul class="selectx-error-list">${items}</ul>`;
      this._errorEl.style.display = "flex";
      if (this._helperEl) this._helperEl.style.display = "none";
    } else {
      this._errorEl.innerHTML = "";
      this._errorEl.style.display = "none";
      if (this._helperEl) this._helperEl.style.display = "";
    }
  }

  private _syncRequiredLabel(): void {
    if (!this._labelEl) return;
    const isRequired = this._rules.validations?.some((v) => v.type === "required") ?? false;
    this._labelEl.classList.toggle("required", isRequired);
  }

  private _updateClearBtn(): void {
    if (!this._clearBtnEl) return;
    const hasValue = this._selectedOption !== null
      || (this._allowFreeText && this._searchText.trim() !== "");
    this._clearBtnEl.style.display = hasValue && !this.hasAttribute("disabled") ? "flex" : "none";
  }

  // ---- Event handlers ----

  private _onInput(e: Event): void {
    this._searchText = (e.target as HTMLInputElement).value;
    this._selectedOption = null;
    this._highlightedIndex = -1;
    this._updateClearBtn();

    if (!this._isOpen) this._openDropdown();
    else this._renderDropdownOptions();

    if (this._allowFreeText) {
      this.dispatchEvent(new CustomEvent("selectx-change", {
        detail: { value: this._searchText || null, option: null },
        bubbles: true,
      }));
    }
  }

  private _onFocus(): void {
    this._openDropdown();
  }

  private _onBlur(): void {
    if (!this._allowFreeText && !this._selectedOption) {
      this._searchText = "";
      if (this._inputEl) this._inputEl.value = "";
    }
    this.dispatchEvent(new CustomEvent("selectx-blur", { bubbles: true }));

    if (this._effectiveValidateOn() === "blur") {
      // setTimeout to let click-on-option fire before blur validation
      setTimeout(() => this._setErrors(this._runValidation().isValid ? [] : this._runValidation().errors), 0);
    }
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (this.hasAttribute("disabled")) return;
    const dropdown = this._dropdownEl!;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!this._isOpen) {
          this._openDropdown();
        } else {
          const maxIdx = dropdown.children.length - 1;
          this._highlightedIndex = Math.min(this._highlightedIndex + 1, maxIdx);
          this._renderDropdownOptions();
          this._scrollHighlightedIntoView();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (this._isOpen) {
          this._highlightedIndex = Math.max(this._highlightedIndex - 1, 0);
          this._renderDropdownOptions();
          this._scrollHighlightedIntoView();
        }
        break;
      case "Enter":
        e.preventDefault();
        if (this._isOpen) {
          const filtered = this._searchText.trim()
            ? this._options.filter((o) => normalizedIncludes(o.label, this._searchText))
            : this._options;
          const idx = this._highlightedIndex >= 0 ? this._highlightedIndex : 0;
          if (filtered[idx]) this._selectOption(filtered[idx]);
        }
        break;
      case "Escape":
        e.preventDefault();
        this._closeDropdown();
        break;
      case "Tab":
        this._closeDropdown();
        break;
    }
  }

  private _onClear(e: Event): void {
    e.stopPropagation();
    this._selectedOption = null;
    this._searchText = "";
    if (this._inputEl) { this._inputEl.value = ""; this._inputEl.focus(); }
    this._updateClearBtn();
    this.dispatchEvent(new CustomEvent("selectx-change", { detail: { value: null, option: null }, bubbles: true }));

    if (this._effectiveValidateOn() === "change") {
      const result = this._runValidation();
      this._setErrors(result.isValid ? [] : result.errors);
    }
  }

  private _onArrowClick(e: Event): void {
    e.stopPropagation();
    if (this._isOpen) this._closeDropdown();
    else { this._openDropdown(); this._inputEl?.focus(); }
  }

  private _scrollHighlightedIntoView(): void {
    if (!this._dropdownEl || this._highlightedIndex < 0) return;
    const el = this._dropdownEl.children[this._highlightedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }

  // ---- Public API ----

  getValue(): string | number | null { return this._getCurrentValue(); }

  setError(errors: string[]): void { this._setErrors(errors); }
  clearError(): void { this._clearErrors(); }
  validate(): FieldValidationResult { return this._runValidation(); }
}

if (!customElements.get("select-x")) {
  customElements.define("select-x", SelectXElement);
}

// ---- Factory types ----

export interface SelectXConfig {
  name: string;
  label?: string;
  placeholder?: string;
  options?: SelectXOption[];
  rules?: InputRules;
  validateOn?: ValidateOn;
  helperText?: string;
  disabled?: boolean;
  allowFreeText?: boolean;
  noResultsText?: string;
  onChange?: (value: string | number | null, option: SelectXOption | null) => void;
  onBlur?: () => void;
}

// ---- Factory function ----

export function SelectX(config: SelectXConfig): SelectXElement {
  const el = document.createElement("select-x") as SelectXElement;

  el.setAttribute("name", config.name);
  if (config.label)         el.setAttribute("label",           config.label);
  if (config.placeholder)   el.setAttribute("placeholder",     config.placeholder);
  if (config.validateOn)    el.setAttribute("validate-on",     config.validateOn);
  if (config.helperText)    el.setAttribute("helper-text",     config.helperText);
  if (config.noResultsText) el.setAttribute("no-results-text", config.noResultsText);
  if (config.disabled)      el.setAttribute("disabled",        "");

  if (config.rules)         el.rules        = config.rules;
  if (config.options)       el.options      = config.options;
  if (config.allowFreeText) el.allowFreeText = config.allowFreeText;

  if (config.onChange) {
    el.addEventListener("selectx-change", (e: Event) => {
      const { value, option } = (e as CustomEvent).detail;
      config.onChange!(value, option);
    });
  }
  if (config.onBlur) {
    el.addEventListener("selectx-blur", () => config.onBlur!());
  }

  return el;
}
