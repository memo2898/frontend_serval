import { changePasswordService } from "../../features/usuarios/services/usuariosService";
import { getGlobalUserData } from "../../global/myUserData";

const miDataRes = getGlobalUserData();
const miData = miDataRes.data;
console.log(miData)

export class PasswordModalManager {
  constructor() {
    this.modal = null;
    this.isInjected = false;
  }

  // Inyectar el modal en el DOM si no existe
  injectModal() {
 
    if (this.isInjected) return;

    const modalHTML = `
      <!-- Modal para cambiar contraseña -->
      <div class="modal password-modal-global" id="passwordModalGlobal">
        <div class="modal_content">
          <div class="modal_header">
            <h3><i class="fas fa-key"></i> Cambiar Contraseña</h3>
            <button class="modal_close" id="closePasswordModalGlobal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal_body">
            <form id="changePasswordFormGlobal">
              <div class="form_group">
                <label for="currentPasswordGlobal">
                  <i class="fas fa-lock"></i> Contraseña Actual
                </label>
                <div class="password_input_wrapper">
                  <input 
                    type="password" 
                    id="currentPasswordGlobal" 
                    name="currentPassword" 
                    required
                    placeholder="Ingresa tu contraseña actual"
                  >
                  <button type="button" class="toggle_password" data-target="currentPasswordGlobal">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="form_group">
                <label for="newPasswordGlobal">
                  <i class="fas fa-key"></i> Nueva Contraseña
                </label>
                <div class="password_input_wrapper">
                  <input 
                    type="password" 
                    id="newPasswordGlobal" 
                    name="newPassword" 
                    required
                    placeholder="Ingresa tu nueva contraseña"
                  >
                  <button type="button" class="toggle_password" data-target="newPasswordGlobal">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
                <div class="password_strength" id="passwordStrengthGlobal"></div>
              </div>

              <div class="form_group">
                <label for="confirmPasswordGlobal">
                  <i class="fas fa-check-circle"></i> Confirmar Contraseña
                </label>
                <div class="password_input_wrapper">
                  <input 
                    type="password" 
                    id="confirmPasswordGlobal" 
                    name="confirmPassword" 
                    required
                    placeholder="Confirma tu nueva contraseña"
                  >
                  <button type="button" class="toggle_password" data-target="confirmPasswordGlobal">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="password_requirements">
                <p><strong>La contraseña debe contener:</strong></p>
                <ul>
                  <li id="req_length_global"><i class="fas fa-circle"></i> Mínimo 8 caracteres</li>
                  <li id="req_uppercase_global"><i class="fas fa-circle"></i> Al menos una mayúscula</li>
                  <li id="req_lowercase_global"><i class="fas fa-circle"></i> Al menos una minúscula</li>
                  <li id="req_number_global"><i class="fas fa-circle"></i> Al menos un número</li>
                  <li id="req_special_global"><i class="fas fa-circle"></i> Al menos un carácter especial</li>
                </ul>
              </div>
            </form>
          </div>
          <div class="modal_footer">
            <button class="btn_secondary" id="cancelPasswordBtnGlobal">Cancelar</button>
            <button class="btn_primary" id="savePasswordBtnGlobal">
              <i class="fas fa-save"></i> Cambiar Contraseña
            </button>
          </div>
        </div>
      </div>
    `;

    // Inyectar en el body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('passwordModalGlobal');
    this.isInjected = true;

    // Configurar event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = document.getElementById('closePasswordModalGlobal');
    const cancelBtn = document.getElementById('cancelPasswordBtnGlobal');
    const saveBtn = document.getElementById('savePasswordBtnGlobal');
    const newPasswordInput = document.getElementById('newPasswordGlobal');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    saveBtn?.addEventListener('click', () => this.savePassword());
    newPasswordInput?.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));

    // Toggle password visibility
    document.querySelectorAll('.password-modal-global .toggle_password').forEach(btn => {
      btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
    });

    // Close modal on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }

  // Abrir el modal
  open() {
    if (!this.isInjected) {
      this.injectModal();
    }
    
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus en el primer input
    setTimeout(() => {
      document.getElementById('currentPasswordGlobal')?.focus();
    }, 100);
  }

  // Cerrar el modal
  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Resetear el formulario
    const form = document.getElementById('changePasswordFormGlobal');
    form?.reset();
    
    // Limpiar indicador de fuerza
    const strengthDiv = document.getElementById('passwordStrengthGlobal');
    if (strengthDiv) strengthDiv.innerHTML = '';
    
    // Resetear requisitos
    ['length', 'uppercase', 'lowercase', 'number', 'special'].forEach(req => {
      const element = document.getElementById(`req_${req}_global`);
      if (element) element.className = '';
    });
  }

  async savePassword() {
    const currentPassword = document.getElementById('currentPasswordGlobal').value;
    const newPassword = document.getElementById('newPasswordGlobal').value;
    const confirmPassword = document.getElementById('confirmPasswordGlobal').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showAlert('Por favor completa todos los campos', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showAlert('Las contraseñas no coinciden', 'error');
      return;
    }

    if (!this.validatePassword(newPassword)) {
      this.showAlert('La contraseña no cumple con los requisitos de seguridad', 'error');
      return;
    }

    try {
      // Deshabilitar el botón mientras se procesa
      const saveBtn = document.getElementById('savePasswordBtnGlobal');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

      // TODO: Implementar llamada al API
      // const response = await fetch('/api/user/change-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ currentPassword, newPassword })
      // });
      
      // Simulación (eliminar en producción)
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.showAlert('Contraseña actualizada correctamente', 'success');
      this.close();

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      this.showAlert('Error al cambiar la contraseña. Intenta nuevamente.', 'error');
    } finally {
      // Restaurar el botón
      const saveBtn = document.getElementById('savePasswordBtnGlobal');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Cambiar Contraseña';
    }
  }

  togglePasswordVisibility(event) {
    const button = event.currentTarget;
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }

  checkPasswordStrength(password) {
    const strengthDiv = document.getElementById('passwordStrengthGlobal');
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Update requirement indicators
    document.getElementById('req_length_global').className = requirements.length ? 'valid' : '';
    document.getElementById('req_uppercase_global').className = requirements.uppercase ? 'valid' : '';
    document.getElementById('req_lowercase_global').className = requirements.lowercase ? 'valid' : '';
    document.getElementById('req_number_global').className = requirements.number ? 'valid' : '';
    document.getElementById('req_special_global').className = requirements.special ? 'valid' : '';

    const validCount = Object.values(requirements).filter(Boolean).length;
    let strength = '';
    let className = '';

    if (validCount <= 2) {
      strength = 'Débil';
      className = 'weak';
    } else if (validCount <= 4) {
      strength = 'Media';
      className = 'medium';
    } else {
      strength = 'Fuerte';
      className = 'strong';
    }

    strengthDiv.innerHTML = `<span class="strength_indicator ${className}">Seguridad: ${strength}</span>`;
  }

  validatePassword(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  showAlert(message, type = 'info') {
    // Implementar según tu sistema de alertas
    alert(message);
  }



  // Agregar este método a la clase PasswordModalManager
checkForcePasswordChange() {
  // Evaluar si el usuario debe cambiar la contraseña
  if (miData?.user?.debe_cambiar_password === true) {
    // Abrir el modal de forma obligatoria
    this.openForced();
  }
}

// Método para abrir el modal de forma forzada (sin poder cerrarlo)
openForced() {
  if (!this.isInjected) {
    this.injectModal();
  }
  
  // Marcar que es un cambio forzado
  this.isForcedChange = true;
  
  // Ocultar botones de cerrar
  const closeBtn = document.getElementById('closePasswordModalGlobal');
  const cancelBtn = document.getElementById('cancelPasswordBtnGlobal');
  
  if (closeBtn) closeBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = 'none';
  
  // Agregar mensaje de advertencia
  const modalBody = this.modal.querySelector('.modal_body');
  const warningMessage = `
    <div class="forced_change_warning" style="
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 20px;
      color: #856404;
    ">
      <i class="fas fa-exclamation-triangle"></i>
      <strong>Cambio de contraseña obligatorio:</strong>
      Por seguridad, debes cambiar tu contraseña antes de continuar.
    </div>
  `;
  
  if (!modalBody.querySelector('.forced_change_warning')) {
    modalBody.insertAdjacentHTML('afterbegin', warningMessage);
  }
  
  this.modal.classList.add('active', 'forced');
  document.body.style.overflow = 'hidden';
  
  // Focus en el primer input
  setTimeout(() => {
    document.getElementById('currentPasswordGlobal')?.focus();
  }, 100);
}

// Modificar el método close para prevenir el cierre si es forzado
close() {
  // Si es un cambio forzado, no permitir cerrar
  if (this.isForcedChange) {
    this.showAlert('Debes cambiar tu contraseña antes de continuar', 'warning');
    return;
  }
  
  this.modal.classList.remove('active');
  document.body.style.overflow = '';
  
  // Resetear el formulario
  const form = document.getElementById('changePasswordFormGlobal');
  form?.reset();
  
  // Limpiar indicador de fuerza
  const strengthDiv = document.getElementById('passwordStrengthGlobal');
  if (strengthDiv) strengthDiv.innerHTML = '';
  
  // Resetear requisitos
  ['length', 'uppercase', 'lowercase', 'number', 'special'].forEach(req => {
    const element = document.getElementById(`req_${req}_global`);
    if (element) element.className = '';
  });
}

// Modificar el método savePassword para manejar el cambio forzado
async savePassword() {
  const currentPassword = document.getElementById('currentPasswordGlobal').value;
  const newPassword = document.getElementById('newPasswordGlobal').value;
  const confirmPassword = document.getElementById('confirmPasswordGlobal').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    this.showAlert('Por favor completa todos los campos', 'warning');
    return;
  }

  if (newPassword !== confirmPassword) {
    this.showAlert('Las contraseñas no coinciden', 'error');
    return;
  }

  if (!this.validatePassword(newPassword)) {
    this.showAlert('La contraseña no cumple con los requisitos de seguridad', 'error');
    return;
  }

  try {
    const saveBtn = document.getElementById('savePasswordBtnGlobal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    // TODO: Implementar llamada al API
    const response = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${miData.access_token}`
      },
      body: JSON.stringify({ 
        currentPassword, 
        newPassword,
        userId: miData.user.id 
      })
    });

    if (!response.ok) {
      throw new Error('Error al cambiar la contraseña');
    }

    const result = await response.json();
    
    // Si era un cambio forzado, actualizar el estado
    if (this.isForcedChange) {
      // Actualizar el objeto miData
      if (miData.user) {
        miData.user.debe_cambiar_password = false;
        miData.user.fecha_ultimo_cambio_password = new Date().toISOString();
      }
      
      // Restaurar la UI normal
      this.isForcedChange = false;
      const closeBtn = document.getElementById('closePasswordModalGlobal');
      const cancelBtn = document.getElementById('cancelPasswordBtnGlobal');
      if (closeBtn) closeBtn.style.display = '';
      if (cancelBtn) cancelBtn.style.display = '';
      
      // Eliminar mensaje de advertencia
      const warning = this.modal.querySelector('.forced_change_warning');
      if (warning) warning.remove();
    }

    this.showAlert('Contraseña actualizada correctamente', 'success');
    this.modal.classList.remove('forced');
    this.close();
    
    // Recargar la página o actualizar el token si es necesario
    if (result.access_token) {
      // Actualizar el token si el backend devuelve uno nuevo
      miData.access_token = result.access_token;
    }

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    this.showAlert('Error al cambiar la contraseña. Intenta nuevamente.', 'error');
  } finally {
    const saveBtn = document.getElementById('savePasswordBtnGlobal');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Cambiar Contraseña';
  }
}
}

// Crear instancia global
const passwordModalManager = new PasswordModalManager();

// Verificar si debe cambiar contraseña al cargar
passwordModalManager.checkForcePasswordChange();

// Exportar para uso global
export function openPasswordModal() {
  passwordModalManager.open();
}

export function closePasswordModal() {
  passwordModalManager.close();
}

// También hacer disponible globalmente en window
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;