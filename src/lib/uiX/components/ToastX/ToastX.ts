// ============================================
// uiX - ToastX (vanilla singleton manager)
// ============================================

import "./toast.css";

export type ToastType     = "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export interface ToastOptions {
  duration?: number;
  position?: ToastPosition;
}

interface ToastState {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  position: ToastPosition;
  el: HTMLDivElement;
  progressBar: HTMLDivElement;
  timer: ReturnType<typeof setInterval> | null;
  remaining: number;
  startedAt: number;
  paused: boolean;
}

// ---- Icons ----

const ICONS: Record<ToastType, string> = {
  success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
  error:   `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`,
  info:    `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};

// ---- Manager ----

class ToastManager {
  private toasts: Map<string, ToastState> = new Map();
  private containers: Map<ToastPosition, HTMLDivElement> = new Map();
  private readonly MAX_PER_POSITION = 5;

  // ---- Containers ----

  private getContainer(position: ToastPosition): HTMLDivElement {
    if (this.containers.has(position)) return this.containers.get(position)!;

    const container = document.createElement("div");
    container.className = `toast-container toast-container-${position}`;
    document.body.appendChild(container);
    this.containers.set(position, container);
    return container;
  }

  // ---- Build toast DOM ----

  private buildToastEl(state: ToastState): HTMLDivElement {
    const toast = document.createElement("div");
    toast.className = `toast toast-${state.type}`;

    // Content row
    const content = document.createElement("div");
    content.className = "toast-content";

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "toast-icon-wrapper";
    iconWrapper.innerHTML = ICONS[state.type];
    content.appendChild(iconWrapper);

    const msg = document.createElement("div");
    msg.className = "toast-message";
    msg.textContent = state.message;
    content.appendChild(msg);

    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.setAttribute("aria-label", "Cerrar");
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener("click", () => this.remove(state.id));
    content.appendChild(closeBtn);

    toast.appendChild(content);

    // Progress bar
    const progressWrap = document.createElement("div");
    progressWrap.className = "toast-progress";

    const progressBar = document.createElement("div");
    progressBar.className = "toast-progress-bar";
    progressBar.style.width = "100%";
    progressWrap.appendChild(progressBar);
    toast.appendChild(progressWrap);

    state.progressBar = progressBar;

    // Pause on hover
    toast.addEventListener("mouseenter", () => this._pauseToast(state.id));
    toast.addEventListener("mouseleave", () => this._resumeToast(state.id));

    return toast;
  }

  // ---- Timer logic ----

  private _startTimer(state: ToastState): void {
    const TICK = 50; // ms
    state.startedAt = Date.now();
    state.paused = false;

    state.timer = setInterval(() => {
      if (state.paused) return;

      const elapsed = Date.now() - state.startedAt;
      state.remaining = state.duration - elapsed;
      const pct = Math.max(0, (state.remaining / state.duration) * 100);
      state.progressBar.style.width = `${pct}%`;

      if (state.remaining <= 0) this.remove(state.id);
    }, TICK);
  }

  private _pauseToast(id: string): void {
    const state = this.toasts.get(id);
    if (!state) return;
    state.remaining = state.duration - (Date.now() - state.startedAt);
    state.paused = true;
  }

  private _resumeToast(id: string): void {
    const state = this.toasts.get(id);
    if (!state) return;
    state.startedAt = Date.now() - (state.duration - state.remaining);
    state.paused = false;
  }

  // ---- Add ----

  add(type: ToastType, message: string, options?: ToastOptions): string {
    const id       = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = options?.duration ?? 4000;
    const position = options?.position ?? "bottom-right";

    const container = this.getContainer(position);

    // Limit per position
    const inPosition = [...this.toasts.values()].filter((t) => t.position === position);
    if (inPosition.length >= this.MAX_PER_POSITION) {
      this.remove(inPosition[0].id);
    }

    const state: ToastState = {
      id, type, message, duration, position,
      el: null!, progressBar: null!,
      timer: null, remaining: duration,
      startedAt: 0, paused: false,
    };

    const el = this.buildToastEl(state);
    state.el = el;
    this.toasts.set(id, state);
    container.appendChild(el);

    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("toast-enter"));
    });

    this._startTimer(state);
    return id;
  }

  // ---- Remove ----

  remove(id: string): void {
    const state = this.toasts.get(id);
    if (!state) return;

    if (state.timer) clearInterval(state.timer);

    // Animate out
    state.el.classList.remove("toast-enter");
    state.el.style.opacity = "0";
    state.el.style.maxHeight = state.el.offsetHeight + "px";

    setTimeout(() => {
      state.el.style.maxHeight = "0";
      state.el.style.marginBottom = "0";
      state.el.style.padding = "0";
    }, 50);

    setTimeout(() => {
      state.el.parentNode?.removeChild(state.el);
      this.toasts.delete(id);
    }, 350);
  }

  // ---- Clear all ----

  clear(): void {
    this.toasts.forEach((_, id) => this.remove(id));
  }
}

// ---- Singleton ----

const manager = new ToastManager();

export const toastx = {
  success: (message: string, options?: ToastOptions) => manager.add("success", message, options),
  error:   (message: string, options?: ToastOptions) => manager.add("error",   message, options),
  warning: (message: string, options?: ToastOptions) => manager.add("warning", message, options),
  info:    (message: string, options?: ToastOptions) => manager.add("info",    message, options),
  clear:   () => manager.clear(),
};
