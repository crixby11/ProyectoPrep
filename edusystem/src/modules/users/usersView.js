import { supabase } from '../../lib/supabaseClient.js'

let currentRole = 'teacher'
let editingUserId = null

/**
 * Renderiza la vista de gestión de usuarios (solo admin)
 */
export async function renderUsersView(container) {
  container.innerHTML = `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-1">Gestión de Usuarios</h1>
          <p class="text-muted mb-0">Administra cuentas de usuarios, roles y permisos</p>
        </div>
        <button class="btn btn-primary" id="btnNewUser">
          <i class="bi bi-person-plus me-2"></i>Nuevo Usuario
        </button>
      </div>

      <!-- Role Filter Pills -->
      <ul class="nav nav-pills mb-4" id="rolePills">
        <li class="nav-item">
          <a class="nav-link active" href="#" data-role="teacher">
            <i class="bi bi-person-badge me-2"></i>Profesores
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" data-role="student">
            <i class="bi bi-people me-2"></i>Estudiantes
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" data-role="admin">
            <i class="bi bi-shield-check me-2"></i>Administradores
          </a>
        </li>
      </ul>

      <!-- Form Container (Hidden by default) -->
      <div id="user-form-container" style="display: none;"></div>

      <!-- User List -->
      <div class="card">
        <div class="card-body">
          <div id="users-list">
            <div class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Setup event listeners
  setupEventListeners()
  
  // Load initial data
  loadUsers('teacher')
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
  // Role filter pills
  document.querySelectorAll('#rolePills .nav-link[data-role]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const role = e.currentTarget.dataset.role
      
      // Update active state
      document.querySelectorAll('#rolePills .nav-link').forEach(l => l.classList.remove('active'))
      e.currentTarget.classList.add('active')
      
      // Load data
      currentRole = role
      loadUsers(role)
    })
  })

  // New user button
  document.getElementById('btnNewUser')?.addEventListener('click', showCreateForm)
}

/**
 * Cargar usuarios por rol
 */
async function loadUsers(role) {
  const container = document.getElementById('users-list')
  if (!container) return

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('rol', role)
      .order('nombre')

    if (error) throw error

    if (users.length === 0) {
      const roleLabels = {
        teacher: { icon: 'bi-person-badge', text: 'profesores' },
        student: { icon: 'bi-people', text: 'estudiantes' },
        admin: { icon: 'bi-shield-check', text: 'administradores' }
      }
      const config = roleLabels[role]
      
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi ${config.icon}" style="font-size: 3rem;"></i>
          <p class="mt-2">No hay ${config.text} registrados</p>
        </div>
      `
      return
    }

    const avatarColors = {
      teacher: 'bg-primary',
      student: 'bg-info',
      admin: 'bg-danger'
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th width="200">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-circle ${avatarColors[role]} text-white me-2">
                      ${user.nombre.charAt(0)}${user.apellido?.charAt(0) || ''}
                    </div>
                    <div>
                      <div class="fw-medium">${user.nombre} ${user.apellido || ''}</div>
                    </div>
                  </div>
                </td>
                <td>${user.email}</td>
                <td>${user.telefono || '<span class="text-muted">—</span>'}</td>
                <td>
                  <span class="badge ${user.activo ? 'bg-success' : 'bg-danger'}">
                    ${user.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-edit-user" data-user-id="${user.id}" title="Editar">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-${user.activo ? 'warning' : 'success'} btn-toggle-status" 
                            data-user-id="${user.id}" data-new-status="${!user.activo}"
                            title="${user.activo ? 'Desactivar' : 'Activar'}">
                      <i class="bi bi-${user.activo ? 'x-circle' : 'check-circle'}"></i>
                    </button>
                    <button class="btn btn-outline-info btn-reset-password" data-user-id="${user.id}" 
                            title="Restablecer contraseña">
                      <i class="bi bi-key"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `

    // Attach event listeners to action buttons
    container.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => editUser(btn.dataset.userId))
    })

    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', () => toggleUserStatus(btn.dataset.userId, btn.dataset.newStatus === 'true'))
    })

    container.querySelectorAll('.btn-reset-password').forEach(btn => {
      btn.addEventListener('click', () => resetPassword(btn.dataset.userId))
    })

  } catch (error) {
    console.error('Error cargando usuarios:', error)
    container.innerHTML = `
      <div class="alert alert-danger mb-0">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar usuarios: ${error.message}
      </div>
    `
  }
}

/**
 * Mostrar formulario de creación
 */
function showCreateForm() {
  editingUserId = null
  const formContainer = document.getElementById('user-form-container')
  
  formContainer.style.display = 'block'
  formContainer.innerHTML = `
    <div class="card mb-4 border-primary">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="bi bi-person-plus me-2"></i>Nuevo Usuario</h5>
        <button class="btn btn-sm btn-light" id="btn-cancel-form">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="card-body">
        <form id="userForm">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Rol <span class="text-danger">*</span></label>
              <select class="form-select" id="formRole" required>
                <option value="">Seleccionar rol...</option>
                <option value="teacher">Profesor</option>
                <option value="student">Estudiante</option>
                <option value="admin">Administrador</option>
                <option value="parent">Padre/Tutor</option>
              </select>
            </div>

            <div class="col-md-8 mb-3">
              <label class="form-label">Email <span class="text-danger">*</span></label>
              <input type="email" class="form-control" id="formEmail" required>
              <small class="text-muted">Se enviará un correo con las credenciales de acceso</small>
            </div>
          </div>

          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Nombre <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="formNombre" required>
            </div>
            
            <div class="col-md-4 mb-3">
              <label class="form-label">Apellido <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="formApellido" required>
            </div>

            <div class="col-md-4 mb-3">
              <label class="form-label">Teléfono</label>
              <input type="tel" class="form-control" id="formTelefono">
            </div>
          </div>

          <div class="mb-3">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="formActivo" checked>
              <label class="form-check-label" for="formActivo">
                Cuenta activa (puede iniciar sesión)
              </label>
            </div>
          </div>

          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <small>
              Se generará automáticamente una contraseña temporal. 
              El usuario deberá cambiarla en su primer inicio de sesión.
            </small>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
              <i class="bi bi-save me-2"></i>Crear Usuario
            </button>
            <button type="button" class="btn btn-secondary" id="btn-cancel-form-bottom">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `

  // Setup form listeners
  document.getElementById('userForm').addEventListener('submit', handleFormSubmit)
  document.getElementById('btn-cancel-form').addEventListener('click', hideForm)
  document.getElementById('btn-cancel-form-bottom').addEventListener('click', hideForm)
  
  // Scroll to form
  formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Editar usuario
 */
async function editUser(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error('editUser: userId inválido:', userId)
    return
  }

  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    editingUserId = userId
    const formContainer = document.getElementById('user-form-container')
    
    formContainer.style.display = 'block'
    formContainer.innerHTML = `
      <div class="card mb-4 border-warning">
        <div class="card-header bg-warning d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="bi bi-pencil me-2"></i>Editar Usuario</h5>
          <button class="btn btn-sm btn-dark" id="btn-cancel-form">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="card-body">
          <form id="userForm">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" value="${user.email}" disabled>
              <small class="text-muted">El email no se puede modificar</small>
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Nombre <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="formNombre" value="${user.nombre}" required>
              </div>
              
              <div class="col-md-4 mb-3">
                <label class="form-label">Apellido <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="formApellido" value="${user.apellido || ''}" required>
              </div>

              <div class="col-md-4 mb-3">
                <label class="form-label">Teléfono</label>
                <input type="tel" class="form-control" id="formTelefono" value="${user.telefono || ''}">
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Rol</label>
              <select class="form-select" id="formRole">
                <option value="teacher" ${user.rol === 'teacher' ? 'selected' : ''}>Profesor</option>
                <option value="student" ${user.rol === 'student' ? 'selected' : ''}>Estudiante</option>
                <option value="admin" ${user.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                <option value="parent" ${user.rol === 'parent' ? 'selected' : ''}>Padre/Tutor</option>
              </select>
            </div>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-warning">
                <i class="bi bi-save me-2"></i>Guardar Cambios
              </button>
              <button type="button" class="btn btn-secondary" id="btn-cancel-form-bottom">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    // Setup form listeners
    document.getElementById('userForm').addEventListener('submit', handleFormSubmit)
    document.getElementById('btn-cancel-form').addEventListener('click', hideForm)
    document.getElementById('btn-cancel-form-bottom').addEventListener('click', hideForm)
    
    // Scroll to form
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })

  } catch (error) {
    console.error('Error cargando usuario:', error)
    alert(`Error al cargar usuario: ${error.message}`)
  }
}

/**
 * Ocultar formulario
 */
function hideForm() {
  const formContainer = document.getElementById('user-form-container')
  formContainer.style.display = 'none'
  formContainer.innerHTML = ''
  editingUserId = null
}

/**
 * Manejar envío de formulario
 */
async function handleFormSubmit(e) {
  e.preventDefault()
  
  if (editingUserId) {
    await updateUser()
  } else {
    await createUser()
  }
}

/**
 * Crear nuevo usuario
 */
async function createUser() {
  const form = document.getElementById('userForm')
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const email = document.getElementById('formEmail').value.trim()
  const nombre = document.getElementById('formNombre').value.trim()
  const apellido = document.getElementById('formApellido').value.trim()
  const telefono = document.getElementById('formTelefono').value.trim()
  const rol = document.getElementById('formRole').value
  const activo = document.getElementById('formActivo').checked

  const tempPassword = generateTempPassword()

  try {
    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: tempPassword,
      options: {
        data: {
          primer_nombre: nombre,
          apellido_paterno: apellido,
          rol: rol
        }
      }
    })

    if (authError) throw authError

    // 2. Crear perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        nombre: nombre,
        apellido: apellido,
        telefono: telefono || null,
        rol: rol,
        activo: activo,
        metadata: {
          temp_password: true,
          created_by_admin: true
        }
      })

    if (profileError) throw profileError

    // Ocultar formulario
    hideForm()

    // Mostrar credenciales
    alert(`Usuario creado exitosamente!\n\nEmail: ${email}\nContraseña temporal: ${tempPassword}\n\nPor favor, guarde esta contraseña y envíela al usuario de forma segura.`)

    // Recargar lista
    loadUsers(rol)
    
    // Cambiar a la tab del rol creado si es diferente
    if (rol !== currentRole) {
      const link = document.querySelector(`#rolePills .nav-link[data-role="${rol}"]`)
      if (link) link.click()
    }

  } catch (error) {
    console.error('Error creando usuario:', error)
    alert(`Error al crear usuario: ${error.message}`)
  }
}

/**
 * Actualizar usuario
 */
async function updateUser() {
  const form = document.getElementById('userForm')
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  if (!editingUserId) {
    alert('Error: No se pudo identificar el usuario.')
    return
  }

  const nombre = document.getElementById('formNombre').value.trim()
  const apellido = document.getElementById('formApellido').value.trim()
  const telefono = document.getElementById('formTelefono').value.trim()
  const rol = document.getElementById('formRole').value

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        nombre: nombre,
        apellido: apellido,
        telefono: telefono || null,
        rol: rol,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingUserId)

    if (error) throw error

    // Ocultar formulario
    hideForm()

    alert('Usuario actualizado exitosamente')

    // Recargar lista actual
    loadUsers(currentRole)

  } catch (error) {
    console.error('Error actualizando usuario:', error)
    alert(`Error al actualizar usuario: ${error.message}`)
  }
}

/**
 * Activar/Desactivar usuario
 */
async function toggleUserStatus(userId, newStatus) {
  const action = newStatus ? 'activar' : 'desactivar'
  
  if (!confirm(`¿Está seguro de ${action} este usuario?${!newStatus ? '\n\nEl usuario no podrá iniciar sesión.' : ''}`)) {
    return
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        activo: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`)

    // Recargar lista
    loadUsers(currentRole)

  } catch (error) {
    console.error('Error actualizando estado:', error)
    alert(`Error al actualizar estado: ${error.message}`)
  }
}

/**
 * Restablecer contraseña
 */
async function resetPassword(userId) {
  if (!confirm('¿Generar nueva contraseña temporal para este usuario?')) {
    return
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, metadata')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    const newTempPassword = generateTempPassword()

    alert(`Nueva contraseña temporal generada:\n\n${newTempPassword}\n\nPor favor, envíe esta contraseña al usuario de forma segura.\n\nNOTA: Necesita configurar Supabase Admin API para aplicar el cambio automáticamente.`)

    // Marcar en metadata
    await supabase
      .from('profiles')
      .update({
        metadata: {
          ...user.metadata,
          temp_password: true,
          password_reset_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

  } catch (error) {
    console.error('Error restableciendo contraseña:', error)
    alert(`Error al restablecer contraseña: ${error.message}`)
  }
}

/**
 * Generar contraseña temporal segura
 */
function generateTempPassword() {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  
  return password
}
