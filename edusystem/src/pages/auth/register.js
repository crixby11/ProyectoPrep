import { register } from '../../components/auth/authHandler.js'
import { showError, showSuccess, isValidEmail } from '../../lib/helpers.js'

/**
 * Renderiza la página de registro
 */
export function renderRegister(container) {
  container.innerHTML = `
    <div class="register-wrapper">
      <div class="register-container">
        <div class="register-header">
          <h1>Edusy</h1>
          <p>Crear cuenta nueva</p>
        </div>
        
        <form id="registerForm" class="register-form">
          <div class="form-columns">
            <!-- Columna Izquierda -->
            <div class="form-column">
              <div class="form-group">
                <label for="primerNombre" class="form-label">Primer nombre *</label>
                <input 
                  type="text" 
                  id="primerNombre" 
                  class="form-control" 
                  placeholder="Juan"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="apellidoPaterno" class="form-label">Apellido paterno *</label>
                <input 
                  type="text" 
                  id="apellidoPaterno" 
                  class="form-control" 
                  placeholder="Pérez"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="email" class="form-label">Correo electrónico *</label>
                <input 
                  type="email" 
                  id="email" 
                  class="form-control" 
                  placeholder="tu@email.com"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="password" class="form-label">Contraseña *</label>
                <input 
                  type="password" 
                  id="password" 
                  class="form-control" 
                  placeholder="Mínimo 6 caracteres"
                  required
                  minlength="6"
                >
              </div>
            </div>
            
            <!-- Columna Derecha -->
            <div class="form-column">
              <div class="form-group">
                <label for="segundoNombre" class="form-label">Segundo nombre</label>
                <input 
                  type="text" 
                  id="segundoNombre" 
                  class="form-control" 
                  placeholder="Carlos"
                >
              </div>
              
              <div class="form-group">
                <label for="apellidoMaterno" class="form-label">Apellido materno</label>
                <input 
                  type="text" 
                  id="apellidoMaterno" 
                  class="form-control" 
                  placeholder="García"
                >
              </div>
              
              <div class="form-group">
                <label for="rol" class="form-label">Tipo de cuenta *</label>
                <select id="rol" class="form-control" required>
                  <option value="">Selecciona...</option>
                  <option value="teacher">Maestro</option>
                  <option value="student">Estudiante</option>
                  <option value="parent">Padre/Tutor</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="confirmPassword" class="form-label">Confirmar contraseña *</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  class="form-control" 
                  placeholder="Repite tu contraseña"
                  required
                >
              </div>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 10px;">
            <button type="submit" class="btn btn-primary btn-block" id="registerBtn">
              Crear Cuenta
            </button>
          </div>
          
          <div class="register-footer">
            <a href="#" id="goToLogin">¿Ya tienes cuenta? Inicia sesión</a>
          </div>
        </form>
        
        <div id="registerMessages"></div>
      </div>
    </div>
  `
  
  addRegisterStyles()
  addRegisterEventListeners(container)
}

/**
 * Agrega event listeners al formulario
 */
function addRegisterEventListeners(container) {
  const registerForm = document.getElementById('registerForm')
  const registerBtn = document.getElementById('registerBtn')
  const messagesContainer = document.getElementById('registerMessages')
  const goToLogin = document.getElementById('goToLogin')
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const primerNombre = document.getElementById('primerNombre').value.trim()
    const segundoNombre = document.getElementById('segundoNombre').value.trim()
    const apellidoPaterno = document.getElementById('apellidoPaterno').value.trim()
    const apellidoMaterno = document.getElementById('apellidoMaterno').value.trim()
    const email = document.getElementById('email').value.trim()
    const rol = document.getElementById('rol').value
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value
    
    // Validaciones
    if (!primerNombre) {
      showError('El primer nombre es requerido', messagesContainer)
      return
    }
    
    if (!apellidoPaterno) {
      showError('El apellido paterno es requerido', messagesContainer)
      return
    }
    
    if (!isValidEmail(email)) {
      showError('El correo electrónico no es válido', messagesContainer)
      return
    }
    
    if (!rol) {
      showError('Debes seleccionar un tipo de cuenta', messagesContainer)
      return
    }
    
    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres', messagesContainer)
      return
    }
    
    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden', messagesContainer)
      return
    }
    
    // Construir nombre completo
    const nombreCompleto = [primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno]
      .filter(n => n)
      .join(' ')
    
    // Deshabilitar botón
    registerBtn.disabled = true
    registerBtn.textContent = 'Creando cuenta...'
    
    try {
      await register(email, password, {
        role: rol,
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre || null,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno || null,
        nombre_completo: nombreCompleto
      })
      
      showSuccess('¡Cuenta creada! Revisa tu correo para verificar tu cuenta.', messagesContainer)
      
      // Limpiar formulario
      registerForm.reset()
      
      // Redirigir a login después de 3 segundos
      setTimeout(async () => {
        const { renderLogin } = await import('./login.js')
        renderLogin(container.parentElement || container)
      }, 3000)
      
    } catch (error) {
      console.error('Error registro:', error)
      showError(error.message || 'Error al crear la cuenta. Intenta de nuevo.', messagesContainer)
      registerBtn.disabled = false
      registerBtn.textContent = 'Crear Cuenta'
    }
  })
  
  goToLogin.addEventListener('click', async (e) => {
    e.preventDefault()
    const { renderLogin } = await import('./login.js')
    renderLogin(container.parentElement || container)
  })
}

/**
 * Estilos para la página de registro
 */
function addRegisterStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .register-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      padding: 20px;
      position: relative;
    }
    
    .register-wrapper::before {
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
    
    .register-container {
      background: white;
      padding: 40px 50px;
      border-radius: 12px;
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      width: 100%;
      max-width: 900px;
      position: relative;
      z-index: 1;
    }
    
    .register-header {
      text-align: center;
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .register-header h1 {
      color: #1e3a5f;
      margin-bottom: 8px;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .register-header p {
      color: #6b7280;
      font-size: 14px;
      font-weight: 400;
      margin: 0;
    }
    
    .register-form .form-group {
      margin-bottom: 20px;
    }
    
    .register-form .form-label {
      color: #374151;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .register-form .form-control,
    .register-form .form-select {
      padding: 12px 16px;
      border: 1.5px solid #d1d5db;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.2s ease;
    }
    
    .register-form .form-control:focus,
    .register-form .form-select:focus {
      border-color: #2c5282;
      box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
    }
    
    .form-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 10px;
    }
    
    .form-column {
      display: flex;
      flex-direction: column;
    }
    
    .btn-block {
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
    
    @media (max-width: 768px) {
      .register-container {
        max-width: 600px;
        padding: 30px;
      }
      
      .form-columns {
        gap: 20px;
      }
    }
    
    @media (max-width: 600px) {
      .form-columns {
        grid-template-columns: 1fr;
        gap: 0;
      }
      
      .register-container {
        padding: 20px;
      }
    }
    
    .form-text {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: #6b7280;
    }
    
    .register-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .register-footer a {
      color: #2c5282;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .register-footer a:hover {
      color: #1e3a5f;
      text-decoration: underline;
    }
  `
  document.head.appendChild(style)
}
