import { login } from '../../components/auth/authHandler.js'
import { showError, showSuccess } from '../../lib/helpers.js'

/**
 * Renderiza la página de login
 */
export function renderLogin(container) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-container">
        <div class="login-header">
          <h1>Edusy</h1>
          <p>Sistema de Gestión Académica</p>
        </div>
        
        <form id="loginForm" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Correo electrónico</label>
            <input 
              type="email" 
              id="email" 
              class="form-control" 
              placeholder="tu@email.com"
              required
              autocomplete="email"
            >
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              class="form-control" 
              placeholder="••••••••"
              required
              autocomplete="current-password"
            >
          </div>
          
          <div class="form-group">
            <button type="submit" class="btn btn-primary btn-block" id="loginBtn">
              Iniciar Sesión
            </button>
          </div>
          
          <div class="login-footer">
            <a href="#" id="forgotPassword">¿Olvidaste tu contraseña?</a>
            <span class="separator">•</span>
            <a href="#" id="goToRegister">Crear cuenta</a>
          </div>
        </form>
        
        <div id="loginMessages"></div>
      </div>
    </div>
  `
  
  // Aplicar estilos
  addLoginStyles()
  
  // Agregar event listeners
  const loginForm = document.getElementById('loginForm')
  const loginBtn = document.getElementById('loginBtn')
  const messagesContainer = document.getElementById('loginMessages')
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    // Deshabilitar botón
    loginBtn.disabled = true
    loginBtn.textContent = 'Iniciando sesión...'
    
    try {
      await login(email, password)
      showSuccess('Sesión iniciada correctamente', messagesContainer)
    } catch (error) {
      console.error('Error login:', error)
      showError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.', messagesContainer)
      loginBtn.disabled = false
      loginBtn.textContent = 'Iniciar Sesión'
    }
  })
  
  // Forgot password
  document.getElementById('forgotPassword').addEventListener('click', async (e) => {
    e.preventDefault()
    const { renderPasswordReset } = await import('./password-reset.js')
    renderPasswordReset(container)
  })
  
  // Go to register
  document.getElementById('goToRegister').addEventListener('click', async (e) => {
    e.preventDefault()
    const { renderRegister } = await import('./register.js')
    renderRegister(container)
  })
}

/**
 * Agrega estilos específicos para la página de login
 */
function addLoginStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      position: relative;
    }
    
    .login-wrapper::before {
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
    
    .login-container {
      background: white;
      padding: 45px;
      border-radius: 12px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 1;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .login-header h1 {
      color: #1e3a5f;
      margin-bottom: 8px;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .login-header p {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
      margin: 0;
    }
    
    .login-form .form-group {
      margin-bottom: 20px;
    }
    
    .login-form .form-label {
      color: #374151;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .login-form .form-control {
      padding: 12px 16px;
      border: 1.5px solid #d1d5db;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.2s ease;
    }
    
    .login-form .form-control:focus {
      border-color: #2c5282;
      box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
    }
    
    .btn-block {
      width: 100%;
      padding: 14px;
      font-size: 15px;
      font-weight: 600;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      border: none;
      border-radius: 8px;
      color: white;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(30, 58, 95, 0.2);
    }
    
    .btn-block:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(30, 58, 95, 0.3);
    }
    
    .btn-block:active {
      transform: translateY(0);
    }
    
    .btn-block:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    
    .login-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .login-footer a {
      color: #2c5282;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .login-footer a:hover {
      color: #1e3a5f;
      text-decoration: underline;
    }
    
    .login-footer .separator {
      margin: 0 12px;
      color: #d1d5db;
    }
    
    #loginMessages {
      margin-top: 20px;
    }
  `
  document.head.appendChild(style)
}
