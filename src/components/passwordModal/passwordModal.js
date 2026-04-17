import { changePasswordService } from "../../features/usuarios/services/usuariosService";
import { changeFalseCambiarPass, getGlobalUserData } from "../../global/myUserData";

const miDataRes = getGlobalUserData();
const miData = miDataRes.data;





// ========================================
// CONFIGURACIÓN DE REQUISITOS DE CONTRASEÑA
// ========================================
export const PASSWORD_CONFIG = {
  // Requisitos obligatorios
  requirements: {
    minLength: 8,                    // Longitud mínima
    maxLength: 128,                  // Longitud máxima (opcional)
    requireUppercase: false,          // Requiere al menos una mayúscula
    requireLowercase: true,          // Requiere al menos una minúscula
    requireNumber: false,             // Requiere al menos un número
    requireSpecialChar: false,        // Requiere al menos un carácter especial
  },

  // Caracteres especiales permitidos - GUION AL FINAL
  specialChars: '!@#$%^&*(),.?":{}|<>_+=[];/\\`~-',

  // Niveles de fortaleza (cuántos requisitos cumplir para cada nivel)
  strengthLevels: {
    weak: { min: 0, max: 2, label: 'Débil', color: '#dc3545' },
    medium: { min: 3, max: 4, label: 'Media', color: '#ffc107' },
    strong: { min: 5, max: 5, label: 'Fuerte', color: '#28a745' }
  },

  // Mensajes personalizables
  messages: {
    allFieldsRequired: 'Por favor completa todos los campos',
    passwordMismatch: 'Las contraseñas no coinciden',
    invalidPassword: 'La contraseña no cumple con los requisitos de seguridad',
    currentPasswordSame: 'La nueva contraseña debe ser diferente a la actual',
    successMessage: 'Contraseña actualizada correctamente',
    errorMessage: 'Error al cambiar la contraseña. Intenta nuevamente.',
    forceChangeWarning: 'Debes cambiar tu contraseña antes de continuar',
    forceChangeMessage: 'Por seguridad, debes cambiar tu contraseña antes de continuar.'
  },

  // Configuración de comportamiento
  behavior: {
    showStrengthIndicator: true,     // Mostrar indicador de fortaleza
    showRequirementsList: true,      // Mostrar lista de requisitos
    reloadOnForceChange: true,       // Recargar página después de cambio forzado
    closeDelay: 1500,                // Delay antes de cerrar el modal (ms)
    messageAutoHide: 5000,           // Auto-ocultar mensajes después de X ms (0 = nunca)
  }
};

// ========================================
// CLASE PRINCIPAL
// ========================================
export class PasswordModalManager {
  constructor() {
    this.modal = null;
    this.isInjected = false;
    this.isForcedChange = false;
    this.config = PASSWORD_CONFIG;
    this.messageTimeout = null;
  }

  // Inyectar el modal en el DOM si no existe
  injectModal() {
    if (this.isInjected) return;

    const modalHTML = `
      <!-- Modal para cambiar contraseña -->
      <div class="modal password-modal-global" id="passwordModalGlobal">
        <div class=" modal_content modal_content_h">
          <div class="modal_header">
            <h3><i class="fas fa-key"></i> Cambiar Contraseña</h3>
            <button class="modal_close" id="closePasswordModalGlobal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Contenedor de mensajes -->
          <div class="password_modal_messages" id="passwordModalMessages"></div>
          
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
                    minlength="${this.config.requirements.minLength}"
                    maxlength="${this.config.requirements.maxLength}"
                    placeholder="Ingresa tu nueva contraseña"
                  >
                  <button type="button" class="toggle_password" data-target="newPasswordGlobal">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
                ${this.config.behavior.showStrengthIndicator ? 
                  '<div class="password_strength" id="passwordStrengthGlobal"></div>' : ''}
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

              ${this.config.behavior.showRequirementsList ? this.generateRequirementsList() : ''}
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

    // Inyectar estilos para los mensajes
    this.injectMessageStyles();

    // Inyectar en el body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('passwordModalGlobal');
    this.isInjected = true;

    // Configurar event listeners
    this.setupEventListeners();
  }

  // Inyectar estilos CSS para los mensajes
  injectMessageStyles() {
    if (document.getElementById('password-modal-message-styles')) return;

    const styles = `
      <style id="password-modal-message-styles">
        .password_modal_messages {
          padding: 0 20px;
          margin: 0;
        }

        .password_message {
          padding: 12px 16px;
          margin: 10px 0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          line-height: 1.5;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }

        .password_message::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }

        .password_message i {
          font-size: 18px;
          flex-shrink: 0;
        }

        .password_message_text {
          flex: 1;
        }

        .password_message_close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
          opacity: 0.7;
        }

        .password_message_close:hover {
          opacity: 1;
          background-color: rgba(0,0,0,0.1);
        }

        .password_message_close i {
          font-size: 14px;
        }

        /* Tipos de mensajes */
        .password_message.success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .password_message.success::before {
          background-color: #28a745;
        }

        .password_message.error {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .password_message.error::before {
          background-color: #dc3545;
        }

        .password_message.warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }

        .password_message.warning::before {
          background-color: #ffc107;
        }

        .password_message.info {
          background-color: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
        }

        .password_message.info::before {
          background-color: #17a2b8;
        }

        /* Animaciones */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }

        .password_message.hiding {
          animation: slideOut 0.3s ease-out forwards;
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Generar lista de requisitos dinámicamente basada en la configuración
  generateRequirementsList() {
    const req = this.config.requirements;
    const requirements = [];

    if (req.minLength) {
      requirements.push({
        id: 'length',
        icon: 'fas fa-circle',
        text: `Mínimo ${req.minLength} caracteres${req.maxLength ? ` (máximo ${req.maxLength})` : ''}`
      });
    }

    if (req.requireUppercase) {
      requirements.push({
        id: 'uppercase',
        icon: 'fas fa-circle',
        text: 'Al menos una mayúscula (A-Z)'
      });
    }

    if (req.requireLowercase) {
      requirements.push({
        id: 'lowercase',
        icon: 'fas fa-circle',
        text: 'Al menos una minúscula (a-z)'
      });
    }

    if (req.requireNumber) {
      requirements.push({
        id: 'number',
        icon: 'fas fa-circle',
        text: 'Al menos un número (0-9)'
      });
    }

    if (req.requireSpecialChar) {
      requirements.push({
        id: 'special',
        icon: 'fas fa-circle',
        text: `Al menos un carácter especial (!@#$%...)`
      });
    }

    if (requirements.length === 0) {
      return '';
    }

    const listItems = requirements.map(req => 
      `<li id="req_${req.id}_global"><i class="${req.icon}"></i> ${req.text}</li>`
    ).join('');

    return `
      <div class="password_requirements">
        <p><strong>La contraseña debe contener:</strong></p>
        <ul>${listItems}</ul>
      </div>
    `;
  }

  setupEventListeners() {
    const closeBtn = document.getElementById('closePasswordModalGlobal');
    const cancelBtn = document.getElementById('cancelPasswordBtnGlobal');
    const saveBtn = document.getElementById('savePasswordBtnGlobal');
    const newPasswordInput = document.getElementById('newPasswordGlobal');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    saveBtn?.addEventListener('click', () => this.savePassword());
    
    if (this.config.behavior.showStrengthIndicator) {
      newPasswordInput?.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
    }

    // Toggle password visibility
    document.querySelectorAll('.password-modal-global .toggle_password').forEach(btn => {
      btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
    });

    // Close modal on outside click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal && !this.isForcedChange) {
        this.close();
      }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active') && !this.isForcedChange) {
        this.close();
      }
    });
  }

  // ========================================
  // SISTEMA DE MENSAJES
  // ========================================
  
  showMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('passwordModalMessages');
    if (!messagesContainer) return;

    // Limpiar timeout anterior
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }

    // Iconos según tipo
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    const messageId = `msg_${Date.now()}`;
    const messageHTML = `
      <div class="password_message ${type}" id="${messageId}">
        <i class="${icons[type] || icons.info}"></i>
        <span class="password_message_text">${message}</span>
        <button type="button" class="password_message_close" onclick="document.getElementById('${messageId}').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Limpiar mensajes anteriores
    messagesContainer.innerHTML = messageHTML;

    // Auto-ocultar si está configurado
    if (this.config.behavior.messageAutoHide > 0) {
      this.messageTimeout = setTimeout(() => {
        const msgElement = document.getElementById(messageId);
        if (msgElement) {
          msgElement.classList.add('hiding');
          setTimeout(() => msgElement.remove(), 300);
        }
      }, this.config.behavior.messageAutoHide);
    }

    // Log en consola también
    const consoleMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
    console[consoleMethod](`[Password Modal - ${type.toUpperCase()}]:`, message);
  }

  clearMessages() {
    const messagesContainer = document.getElementById('passwordModalMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }

  // ========================================
  // MÉTODOS PRINCIPALES
  // ========================================

  open() {
    if (!this.isInjected) {
      this.injectModal();
    }
    
    this.clearMessages();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      document.getElementById('currentPasswordGlobal')?.focus();
    }, 100);
  }

  close() {
    if (this.isForcedChange) {
      this.showMessage(this.config.messages.forceChangeWarning, 'warning');
      return;
    }
    
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    
    const form = document.getElementById('changePasswordFormGlobal');
    form?.reset();
    
    if (this.config.behavior.showStrengthIndicator) {
      const strengthDiv = document.getElementById('passwordStrengthGlobal');
      if (strengthDiv) strengthDiv.innerHTML = '';
    }
    
    this.resetRequirements();
    this.clearMessages();
  }

  resetRequirements() {
    const req = this.config.requirements;
    const requirementIds = [];

    if (req.minLength) requirementIds.push('length');
    if (req.requireUppercase) requirementIds.push('uppercase');
    if (req.requireLowercase) requirementIds.push('lowercase');
    if (req.requireNumber) requirementIds.push('number');
    if (req.requireSpecialChar) requirementIds.push('special');

    requirementIds.forEach(reqId => {
      const element = document.getElementById(`req_${reqId}_global`);
      if (element) element.className = '';
    });
  }

 async savePassword() {
  const currentPassword = document.getElementById('currentPasswordGlobal').value;
  const newPassword = document.getElementById('newPasswordGlobal').value;
  const confirmPassword = document.getElementById('confirmPasswordGlobal').value;

  // Limpiar mensajes anteriores
  this.clearMessages();

  // Validaciones
  if (!currentPassword || !newPassword || !confirmPassword) {
    this.showMessage(this.config.messages.allFieldsRequired, 'warning');
    return;
  }

  if (newPassword !== confirmPassword) {
    this.showMessage(this.config.messages.passwordMismatch, 'error');
    return;
  }

  const validationResult = this.validatePassword(newPassword);
  if (!validationResult.isValid) {
    this.showMessage(validationResult.message || this.config.messages.invalidPassword, 'error');
    return;
  }

  try {
    const saveBtn = document.getElementById('savePasswordBtnGlobal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    const userId = miData?.user?.id;
    
    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario');
    }

    const passwordData = {
      current_password: currentPassword,
      new_password: newPassword
    };

  


    // Llamar al servicio
    const response = await changePasswordService(userId, passwordData);

    // ============================================
    // MANEJAR RESPUESTA EXITOSA
    // ============================================
    
    // Actualizar estado si era cambio forzado
    if (this.isForcedChange) {
      if (miData.user) {
        miData.user.debe_cambiar_password = false;
        miData.user.fecha_ultimo_cambio_password = new Date().toISOString();

    changeFalseCambiarPass()
  


      }
      
      this.isForcedChange = false;
      const closeBtn = document.getElementById('closePasswordModalGlobal');
      const cancelBtn = document.getElementById('cancelPasswordBtnGlobal');
      if (closeBtn) closeBtn.style.display = '';
      if (cancelBtn) cancelBtn.style.display = '';
      
      const warning = this.modal.querySelector('.forced_change_warning');
      if (warning) warning.remove();
      
      this.modal.classList.remove('forced');
    }

    // Mostrar mensaje de éxito del servidor o mensaje por defecto
    const successMessage = response?.message || this.config.messages.successMessage;
    this.showMessage(successMessage, 'success');

    
    // Cerrar modal después del delay configurado
    setTimeout(() => {
      this.close();
      
      // Recargar si es necesario
      if (this.config.behavior.reloadOnForceChange && 
          miData.user?.debe_cambiar_password === false) {
        location.reload();
      }
    }, this.config.behavior.closeDelay);

  } catch (error) {
    // ============================================
    // MANEJAR ERRORES DEL SERVICIO
    // ============================================
    
    console.error('Error al cambiar contraseña:', error);
    
    let errorMessage = this.config.messages.errorMessage;
    let errorType = 'error';
    
    // Extraer mensaje del error si existe
    if (error.message) {
      errorMessage = error.message;
      
      // Clasificar tipo de error según el mensaje
      if (error.message.includes('contraseña actual') || 
          error.message.includes('incorrecta') ||
          error.message.includes('no coincide')) {
        errorType = 'error';
      } else if (error.message.includes('diferente') ||
                 error.message.includes('debe ser')) {
        errorType = 'warning';
      }
    }
    
    // Si el error tiene información de statusCode
    if (error.statusCode) {
      switch (error.statusCode) {
        case 401:
          errorType = 'error';
          errorMessage = error.message || 'La contraseña actual es incorrecta';
          break;
        case 400:
          errorType = 'warning';
          errorMessage = error.message || 'Datos inválidos. Por favor verifica la información';
          break;
        case 404:
          errorType = 'error';
          errorMessage = 'Usuario no encontrado';
          break;
        case 500:
          errorType = 'error';
          errorMessage = 'Error del servidor. Por favor intenta más tarde';
          break;
        default:
          errorMessage = error.message || this.config.messages.errorMessage;
      }
    }
    
    this.showMessage(errorMessage, errorType);
    
  } finally {
    // ============================================
    // RESTAURAR BOTÓN
    // ============================================
    const saveBtn = document.getElementById('savePasswordBtnGlobal');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Cambiar Contraseña';
    }
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
  if (!this.config.behavior.showStrengthIndicator) return;

  const strengthDiv = document.getElementById('passwordStrengthGlobal');
  if (!strengthDiv) return;

  const req = this.config.requirements;
  const requirements = {};

  // Solo evaluar requisitos que están habilitados
  if (req.minLength) {
    requirements.length = password.length >= req.minLength;
    const lengthElement = document.getElementById('req_length_global');
    if (lengthElement) lengthElement.className = requirements.length ? 'valid' : '';
  }

  if (req.requireUppercase) {
    requirements.uppercase = /[A-Z]/.test(password);
    const uppercaseElement = document.getElementById('req_uppercase_global');
    if (uppercaseElement) uppercaseElement.className = requirements.uppercase ? 'valid' : '';
  }

  if (req.requireLowercase) {
    requirements.lowercase = /[a-z]/.test(password);
    const lowercaseElement = document.getElementById('req_lowercase_global');
    if (lowercaseElement) lowercaseElement.className = requirements.lowercase ? 'valid' : '';
  }

  if (req.requireNumber) {
    requirements.number = /[0-9]/.test(password);
    const numberElement = document.getElementById('req_number_global');
    if (numberElement) numberElement.className = requirements.number ? 'valid' : '';
  }

  if (req.requireSpecialChar) {
    requirements.special = this.checkSpecialChar(password);
    const specialElement = document.getElementById('req_special_global');
    if (specialElement) specialElement.className = requirements.special ? 'valid' : '';
  }

  // Calcular fortaleza basado en requisitos CUMPLIDOS vs TOTALES HABILITADOS
  const totalRequirements = Object.keys(requirements).length; // Total de requisitos habilitados
  const validCount = Object.values(requirements).filter(Boolean).length; // Requisitos cumplidos
  
  // Si no hay requisitos habilitados, considerar fuerte por defecto
  if (totalRequirements === 0) {
    strengthDiv.innerHTML = `
      <span class="strength_indicator" style="color: #28a745">
        Seguridad: Fuerte
      </span>
    `;
    return;
  }

  // Calcular porcentaje de cumplimiento
  const percentage = (validCount / totalRequirements) * 100;
  
  let strengthLevel = null;
  
  // Determinar nivel basado en porcentaje de cumplimiento
  if (percentage < 50) {
    strengthLevel = { label: 'Débil', color: '#dc3545' };
  } else if (percentage < 100) {
    strengthLevel = { label: 'Media', color: '#ffc107' };
  } else {
    strengthLevel = { label: 'Fuerte', color: '#28a745' };
  }

  strengthDiv.innerHTML = `
    <span class="strength_indicator" style="color: ${strengthLevel.color}">
      Seguridad: ${strengthLevel.label} (${validCount}/${totalRequirements})
    </span>
  `;
}

  // Método simple y seguro para verificar caracteres especiales
  checkSpecialChar(password) {
    // Verifica si hay cualquier carácter que no sea letra o número
    return /[^A-Za-z0-9]/.test(password);
  }

  validatePassword(password) {
    const req = this.config.requirements;
    const errors = [];

    if (req.minLength && password.length < req.minLength) {
      errors.push(`La contraseña debe tener al menos ${req.minLength} caracteres`);
    }

    if (req.maxLength && password.length > req.maxLength) {
      errors.push(`La contraseña no debe exceder ${req.maxLength} caracteres`);
    }

    if (req.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (req.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    if (req.requireNumber && !/[0-9]/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (req.requireSpecialChar && !this.checkSpecialChar(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      message: errors.join('. ')
    };
  }

  checkForcePasswordChange() {
    if (miData?.user?.debe_cambiar_password === true) {
      this.openForced();
    }
  }

  openForced() {
    if (!this.isInjected) {
      this.injectModal();
    }
    
    this.isForcedChange = true;
    
    const closeBtn = document.getElementById('closePasswordModalGlobal');
    const cancelBtn = document.getElementById('cancelPasswordBtnGlobal');
    
    if (closeBtn) closeBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    
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
        ${this.config.messages.forceChangeMessage}
      </div>
    `;
    
    if (!modalBody.querySelector('.forced_change_warning')) {
      modalBody.insertAdjacentHTML('afterbegin', warningMessage);
    }
    
    this.modal.classList.add('active', 'forced');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    setTimeout(() => {
      document.getElementById('currentPasswordGlobal')?.focus();
    }, 100);
  }
}

// Crear instancia global
const passwordModalManager = new PasswordModalManager();

// Verificar si debe cambiar contraseña al cargar
passwordModalManager.checkForcePasswordChange();

// Exportar funciones
export function openPasswordModal() {
  passwordModalManager.open();
}

export function closePasswordModal() {
  passwordModalManager.close();
}

export function updatePasswordConfig(newConfig) {
  Object.assign(PASSWORD_CONFIG, newConfig);
}

// Función para mostrar mensajes desde fuera
export function showPasswordMessage(message, type = 'info') {
  passwordModalManager.showMessage(message, type);
}

// Disponible globalmente
window.openPasswordModal = openPasswordModal;
window.closePasswordModal = closePasswordModal;
window.updatePasswordConfig = updatePasswordConfig;
window.showPasswordMessage = showPasswordMessage;
window.PASSWORD_CONFIG = PASSWORD_CONFIG;