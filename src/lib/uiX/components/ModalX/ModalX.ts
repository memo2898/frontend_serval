// ============================================
// uiX - ModalX (class-based, portal to body)
// ============================================

import "./ModalX.css";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full" | string;

export interface ModalXConfig {
  title?: string;
  size?: ModalSize;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  body?: HTMLElement;
  footer?: HTMLElement | HTMLElement[];
}

const SIZE_MAP: Record<string, string> = {
  sm: "400px",
  md: "600px",
  lg: "800px",
  xl: "1000px",
  full: "95vw",
};

function resolveWidth(size: ModalSize): string {
  if (SIZE_MAP[size]) return SIZE_MAP[size];
  return size; // permite pasar "480px" directamente
}

// ---- ModalX instance ----

export class ModalXInstance {
  private _overlay: HTMLDivElement;
  private _container: HTMLDivElement;
  private _bodyEl: HTMLDivElement;
  private _footerEl: HTMLDivElement;
  private _isOpen = false;
  private _closeTimer: ReturnType<typeof setTimeout> | null = null;

  private _onClose: () => void;
  private _closeOnOverlay: boolean;
  private _closeOnEsc: boolean;

  private _escHandler: (e: KeyboardEvent) => void;

  constructor(config: ModalXConfig = {}) {
    const {
      title,
      size = "md",
      closeOnOverlay = true,
      closeOnEsc = true,
      showCloseButton = true,
      onClose,
      body,
      footer,
    } = config;

    this._closeOnOverlay = closeOnOverlay;
    this._closeOnEsc = closeOnEsc;
    this._onClose = onClose ?? (() => this.close());

    // ---- Build DOM ----
    this._overlay = document.createElement("div");
    this._overlay.className = "modal-overlay";
    this._overlay.addEventListener("click", (e) => {
      if (this._closeOnOverlay && e.target === this._overlay) {
        this._onClose();
      }
    });

    this._container = document.createElement("div");
    this._container.className = "modal-container";
    this._container.style.width = resolveWidth(size);

    // Header
    if (title || showCloseButton) {
      const header = document.createElement("div");
      header.className = "modal-header";

      if (title) {
        const titleEl = document.createElement("h2");
        titleEl.className = "modal-title";
        titleEl.textContent = title;
        header.appendChild(titleEl);
      }

      if (showCloseButton) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "modal-close-btn";
        closeBtn.setAttribute("aria-label", "Cerrar");
        closeBtn.textContent = "×";
        closeBtn.addEventListener("click", () => this._onClose());
        header.appendChild(closeBtn);
      }

      this._container.appendChild(header);
    }

    // Body
    this._bodyEl = document.createElement("div");
    this._bodyEl.className = "modal-body";
    if (body) this._bodyEl.appendChild(body);
    this._container.appendChild(this._bodyEl);

    // Footer
    this._footerEl = document.createElement("div");
    this._footerEl.className = "modal-footer";
    if (footer) {
      const items = Array.isArray(footer) ? footer : [footer];
      items.forEach((el) => this._footerEl.appendChild(el));
    }
    if (footer) this._container.appendChild(this._footerEl);

    this._overlay.appendChild(this._container);

    // ESC handler (bound once)
    this._escHandler = (e: KeyboardEvent) => {
      if (this._closeOnEsc && e.key === "Escape") this._onClose();
    };
  }

  // ---- Public API ----

  open(): void {
    if (this._isOpen) return;
    this._isOpen = true;

    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
      this._closeTimer = null;
    }

    document.body.style.overflow = "hidden";
    document.body.appendChild(this._overlay);
    document.addEventListener("keydown", this._escHandler);

    // Trigger CSS transitions (needs a frame to apply initial state first)
    requestAnimationFrame(() => {
      this._overlay.setAttribute("data-visible", "true");
      this._container.setAttribute("data-visible", "true");
    });
  }

  close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;

    this._overlay.setAttribute("data-visible", "false");
    this._container.setAttribute("data-visible", "false");
    document.removeEventListener("keydown", this._escHandler);
    document.body.style.overflow = "";

    // Remove from DOM after transition ends (300ms)
    this._closeTimer = setTimeout(() => {
      if (this._overlay.parentNode) {
        document.body.removeChild(this._overlay);
      }
      this._closeTimer = null;
    }, 300);
  }

  // Replace body content dynamically
  setBody(el: HTMLElement): void {
    this._bodyEl.innerHTML = "";
    this._bodyEl.appendChild(el);
  }

  // Replace footer content dynamically
  setFooter(elements: HTMLElement | HTMLElement[]): void {
    this._footerEl.innerHTML = "";
    const items = Array.isArray(elements) ? elements : [elements];
    items.forEach((el) => this._footerEl.appendChild(el));
    // Ensure footer is in container
    if (!this._footerEl.parentNode) {
      this._container.appendChild(this._footerEl);
    }
  }

  get isOpen(): boolean { return this._isOpen; }
}

// ---- Factory function ----

export function ModalX(config: ModalXConfig = {}): ModalXInstance {
  return new ModalXInstance(config);
}
