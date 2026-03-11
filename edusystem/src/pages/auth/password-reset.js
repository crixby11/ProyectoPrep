import { resetPassword } from '../../components/auth/authHandler.js'
import { showError, showSuccess, isValidEmail } from '../../lib/helpers.js'

/**
 * Renderiza la página de recuperación de contraseña
 */
export function renderPasswordReset(container) {
  container.innerHTML = `
    <div class="reset-wrapper">
      <div class="reset-container">
        <div class="reset-header">
          <h1>🔐 Recuperar Contraseña</h1>
          <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
        </div>
        
        <form id="resetForm" class="reset-form">
          <div class="form-group">
            <label for="email" class="form-label">Correo electrónico</label>
            <input 
              type="email" 
              id="email" 
              class="form-control" 
              placeholder="tu@email.com"
              required
            >
          </div>
          
          <div class="form-group">
            <button type="submit" class="btn btn-primary btn-block" id="resetBtn">
              Enviar enlace de recuperación
            </button>
          </div>
          
          <div class="reset-footer">
            <a href="#" id="goToLogin">Volver al inicio de sesión</a>
          </div>
        </form>
        
        <div id="resetMessages"></div>
      </div>
    </div>
  `
  
  addResetStyles()
  addResetEventListeners(container)
}

/**
 * Agrega event listeners
 */
function addResetEventListeners(container) {
  const resetForm = document.getElementById('resetForm')
  const resetBtn = document.getElementById('resetBtn')
  const messagesContainer = document.getElementById('resetMessages')
  const goToLogin = document.getElementById('goToLogin')
  
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const email = document.getElementById('email').value.trim()
    
    if (!isValidEmail(email)) {
      showError('El correo electrónico no es válido', messagesContainer)
      return
    }
    
    resetBtn.disabled = true
    resetBtn.textContent = 'Enviando...'
    
    try {
      await resetPassword(email)
      showSuccess('¡Correo enviado! Revisa tu bandeja de entrada.', messagesContainer)
      resetForm.reset()
    } catch (error) {
      console.error('Error reset:', error)
      showError(error.message || 'Error al enviar el correo. Intenta de nuevo.', messagesContainer)
    } finally {
      resetBtn.disabled = false
      resetBtn.textContent = 'Enviar enlace de recuperación'
    }
  })
  
  goToLogin.addEventListener('click', async (e) => {
    e.preventDefault()
    const { renderLogin } = await import('./login.js')
    renderLogin(container.parentElement || container)
  })
}

/**
 * Estilos
 */
function addResetStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .reset-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      position: relative;
    }
    
    .reset-wrapper::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
    }
    
    .reset-container {
      background: white;
      padding: 45px;
      border-radius: 12px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      width: 100%;
      max-width: 450px;
      position: relative;
      z-index: 1;
    }
    
    .reset-header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .reset-header h1 {
      color: #1e3a5f;
      margin-bottom: 8px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .reset-header p {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.5;
      margin: 0;
    }
    
    .reset-form .form-group {
      margin-bottom: 20px;
    }
    
    .reset-form .form-label {
      color: #374151;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .reset-form .form-control {
      padding: 12px 16px;
      border: 1.5px solid #d1d5db;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.2s ease;
    }
    
    .reset-form .form-control:focus {
      border-color: #2c5282;
      box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
    }
    
    .reset-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .reset-footer a {
      color: #2c5282;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .reset-footer a:hover {
      color: #1e3a5f;
      text-decoration: underline;
    }
  `
  document.head.appendChild(style)
}
