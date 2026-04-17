// ============================================
// Feature: Mi Perfil
// ============================================

import './mi-perfil.css';
import { toastx } from '@/lib/uiX/components/ToastX';
import { getUser, getSelectedRole } from '@/global/session.service';
import { updateProfile, updatePin } from './mi-perfil.service';
import type { LoginUser } from '@/features/backoffice/auth/auth.types';

// ── Helpers ──────────────────────────────────────────────────

const ROLE_ICONS: Record<string, string> = {
  administrador: 'fa-user-shield',
  encargado:     'fa-user-tie',
  cajero:        'fa-cash-register',
  camarero:      'fa-concierge-bell',
  cocinero:      'fa-utensils',
  bartender:     'fa-wine-glass-alt',
};

function getIconForRole(nombre: string): string {
  return ROLE_ICONS[nombre.toLowerCase()] ?? 'fa-user-circle';
}

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message: string | string[] }).message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg;
  }
  return 'Error desconocido';
}

// ── Header de perfil ─────────────────────────────────────────

function renderHeader(user: LoginUser): HTMLElement {
  const rol = getSelectedRole();
  const estado = user.estado ?? 'activo';
  const estadoClass = estado.toLowerCase() === 'activo' ? 'activo' : 'inactivo';

  const header = document.createElement('div');
  header.className = 'perfil-header';

  header.innerHTML = `
    <div class="perfil-avatar">${getInitials(user.nombre, user.apellido)}</div>
    <div class="perfil-header-info">
      <div class="perfil-header-name" id="perfilHeaderName">${user.nombre} ${user.apellido}</div>
      <div class="perfil-header-meta">
        <span>@${user.username}</span>
        <span class="perfil-meta-sep">·</span>
        <span class="perfil-estado-badge ${estadoClass}">
          <i class="fas fa-circle" style="font-size:7px"></i>
          ${estado}
        </span>
        ${rol ? `<span class="perfil-meta-sep">·</span><span>${rol.nombre}</span>` : ''}
      </div>
    </div>
  `;

  return header;
}

// ── Sección: Información personal ────────────────────────────

function renderInfoSection(user: LoginUser): HTMLElement {
  const card = document.createElement('div');
  card.className = 'perfil-card';

  card.innerHTML = `
    <div class="perfil-card-title">
      <i class="fas fa-user"></i>
      Información personal
    </div>
    <p class="perfil-card-desc">Actualiza tu nombre y apellido.</p>
    <div class="perfil-divider"></div>
    <div class="perfil-fields">
      <div class="perfil-field">
        <label for="perfilNombre">Nombre</label>
        <input id="perfilNombre" type="text" value="${user.nombre}" maxlength="80" autocomplete="off" />
      </div>
      <div class="perfil-field">
        <label for="perfilApellido">Apellido</label>
        <input id="perfilApellido" type="text" value="${user.apellido}" maxlength="80" autocomplete="off" />
      </div>
    </div>
    <div class="perfil-fields single">
      <div class="perfil-field">
        <label for="perfilUsername">Nombre de usuario</label>
        <input id="perfilUsername" type="text" value="${user.username}" readonly />
      </div>
    </div>
    <div class="perfil-actions">
      <button class="btn btn-primary" id="btnGuardarInfo">Guardar cambios</button>
    </div>
  `;

  const btnGuardar = card.querySelector<HTMLButtonElement>('#btnGuardarInfo')!;
  const inputNombre   = card.querySelector<HTMLInputElement>('#perfilNombre')!;
  const inputApellido = card.querySelector<HTMLInputElement>('#perfilApellido')!;

  btnGuardar.addEventListener('click', async () => {
    const nombre   = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();

    if (!nombre || !apellido) {
      toastx.warning('Nombre y apellido son obligatorios.');
      return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';

    try {
      await updateProfile(user.id, { nombre, apellido });

      // Actualizar header en tiempo real
      const headerName = document.getElementById('perfilHeaderName');
      if (headerName) headerName.textContent = `${nombre} ${apellido}`;

      // Actualizar initial del avatar
      const avatar = document.querySelector<HTMLElement>('.perfil-avatar');
      if (avatar) avatar.textContent = getInitials(nombre, apellido);

      // Actualizar referencia local para próximas operaciones
      user.nombre   = nombre;
      user.apellido = apellido;

      toastx.success('Información actualizada correctamente.');
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar cambios';
    }
  });

  return card;
}

// ── Sección: Cambiar PIN ──────────────────────────────────────

function renderPinSection(user: LoginUser): HTMLElement {
  const card = document.createElement('div');
  card.className = 'perfil-card';

  card.innerHTML = `
    <div class="perfil-card-title">
      <i class="fas fa-lock"></i>
      Cambiar PIN
    </div>
    <p class="perfil-card-desc">El PIN se usa para identificarte en el punto de venta.</p>
    <div class="perfil-divider"></div>
    <div class="perfil-fields">
      <div class="perfil-field">
        <label for="perfilPinActual">PIN actual</label>
        <input id="perfilPinActual" type="password" placeholder="••••" maxlength="20" autocomplete="current-password" />
      </div>
    </div>
    <div class="perfil-fields">
      <div class="perfil-field">
        <label for="perfilPinNuevo">PIN nuevo</label>
        <input id="perfilPinNuevo" type="password" placeholder="••••" maxlength="20" autocomplete="new-password" />
      </div>
      <div class="perfil-field">
        <label for="perfilPinConfirmar">Confirmar PIN nuevo</label>
        <input id="perfilPinConfirmar" type="password" placeholder="••••" maxlength="20" autocomplete="new-password" />
      </div>
    </div>
    <div class="perfil-actions">
      <button class="btn btn-primary" id="btnGuardarPin">Cambiar PIN</button>
    </div>
  `;

  const btnGuardar   = card.querySelector<HTMLButtonElement>('#btnGuardarPin')!;
  const inputActual  = card.querySelector<HTMLInputElement>('#perfilPinActual')!;
  const inputNuevo   = card.querySelector<HTMLInputElement>('#perfilPinNuevo')!;
  const inputConfirm = card.querySelector<HTMLInputElement>('#perfilPinConfirmar')!;

  btnGuardar.addEventListener('click', async () => {
    const pinActual  = inputActual.value;
    const pinNuevo   = inputNuevo.value.trim();
    const pinConfirm = inputConfirm.value.trim();

    if (!pinActual || !pinNuevo || !pinConfirm) {
      toastx.warning('Completa todos los campos del PIN.');
      return;
    }

    if (pinActual !== user.pin) {
      toastx.error('El PIN actual es incorrecto.');
      inputActual.focus();
      return;
    }

    if (pinNuevo !== pinConfirm) {
      toastx.error('El PIN nuevo y la confirmación no coinciden.');
      inputConfirm.focus();
      return;
    }

    if (pinNuevo === pinActual) {
      toastx.warning('El PIN nuevo debe ser diferente al actual.');
      inputNuevo.focus();
      return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';

    try {
      await updatePin(user.id, { pin: pinNuevo });

      // Actualizar referencia local para validaciones futuras en la misma sesión
      user.pin = pinNuevo;

      inputActual.value  = '';
      inputNuevo.value   = '';
      inputConfirm.value = '';

      toastx.success('PIN actualizado correctamente.');
    } catch (err) {
      toastx.error(getErrorMessage(err));
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Cambiar PIN';
    }
  });

  return card;
}

// ── Sección: Accesos asignados ────────────────────────────────

function renderRolesSection(user: LoginUser): HTMLElement {
  const card = document.createElement('div');
  card.className = 'perfil-card';

  const roles = user.roles ?? [];

  const chipsHTML = roles.length > 0
    ? roles.map(r => `
        <span class="perfil-role-chip">
          <i class="fas ${getIconForRole(r.nombre)}"></i>
          ${r.nombre}
        </span>
      `).join('')
    : `<span class="perfil-empty">Sin roles asignados</span>`;

  card.innerHTML = `
    <div class="perfil-card-title">
      <i class="fas fa-id-badge"></i>
      Accesos asignados
    </div>
    <p class="perfil-card-desc">Roles que tiene asignados tu cuenta. Solo un administrador puede modificarlos.</p>
    <div class="perfil-divider"></div>
    <div class="perfil-roles-list">${chipsHTML}</div>
  `;

  return card;
}

// ── Mount ─────────────────────────────────────────────────────

export function MiPerfil(container: HTMLElement): void {
  const user = getUser();

  if (!user) {
    container.innerHTML = `<p style="color:#dc2626;padding:24px">No se pudo cargar la información del usuario.</p>`;
    return;
  }

  container.appendChild(renderHeader(user));
  container.appendChild(renderInfoSection(user));
  container.appendChild(renderPinSection(user));
  container.appendChild(renderRolesSection(user));
}
