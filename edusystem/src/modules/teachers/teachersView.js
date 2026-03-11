import { supabase } from '../../lib/supabaseClient.js'

/**
 * Muestra una notificación de éxito bonita
 */
function showSuccessNotification(title, teacherName) {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    animation: slideInDown 0.3s ease-out;
  `
  
  notification.innerHTML = `
    <style>
      @keyframes slideInDown {
        from {
          opacity: 0;
          top: -100px;
        }
        to {
          opacity: 1;
          top: 20px;
        }
      }
      @keyframes slideOutUp {
        from {
          opacity: 1;
          top: 20px;
        }
        to {
          opacity: 0;
          top: -100px;
        }
      }
    </style>
    <div class="alert alert-success shadow-lg border-0" 
         style="min-width: 400px; max-width: 500px; margin: 0;">
      <div class="d-flex align-items-center">
        <div class="flex-shrink-0">
          <div class="rounded-circle bg-success d-flex align-items-center justify-content-center" 
               style="width: 48px; height: 48px;">
            <i class="bi bi-check-circle-fill text-white fs-4"></i>
          </div>
        </div>
        <div class="flex-grow-1 ms-3">
          <h5 class="alert-heading mb-1 fw-bold">${title}</h5>
          <p class="mb-0 small">
            <i class="bi bi-person-badge me-1"></i>
            ${teacherName}
          </p>
        </div>
        <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.parentElement.remove()"></button>
      </div>
    </div>
  `
  
  document.body.appendChild(notification)
  
  // Auto cerrar después de 4 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOutUp 0.3s ease-out'
    setTimeout(() => notification.remove(), 300)
  }, 4000)
}

/**
 * Renderiza la vista de listado de maestros
 */
export async function renderTeachersView(container) {
  // Obtener maestros de la base de datos
  const { data: teachers, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'teacher')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error cargando maestros:', error)
  }
  
  container.innerHTML = `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Gestión de Maestros</h2>
          <p class="text-muted mb-0">Administra todos los maestros de la institución</p>
        </div>
        <button class="btn btn-primary" id="addTeacherBtn">
          <i class="bi bi-plus-circle me-2"></i>
          Nuevo Maestro
        </button>
      </div>
      
      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <input type="text" class="form-control" id="searchTeacher" placeholder="Buscar por nombre o email...">
            </div>
            <div class="col-md-3">
              <select class="form-control" id="filterStatus">
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            <div class="col-md-3">
              <button class="btn btn-outline-secondary w-100" id="clearFilters">
                <i class="bi bi-x-circle me-1"></i>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Total de Maestros</p>
                  <h3 class="mb-0">${teachers?.length || 0}</h3>
                </div>
                <div class="icon-box bg-primary bg-opacity-10 text-primary">
                  <i class="bi bi-person-badge fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Maestros Activos</p>
                  <h3 class="mb-0">${teachers?.filter(t => t.activo).length || 0}</h3>
                </div>
                <div class="icon-box bg-success bg-opacity-10 text-success">
                  <i class="bi bi-check-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Maestros Inactivos</p>
                  <h3 class="mb-0">${teachers?.filter(t => !t.activo).length || 0}</h3>
                </div>
                <div class="icon-box bg-warning bg-opacity-10 text-warning">
                  <i class="bi bi-pause-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabla de Maestros -->
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">Listado de Maestros</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody id="teachersTableBody">
                ${teachers && teachers.length > 0 
                  ? teachers.map(teacher => renderTeacherRow(teacher)).join('') 
                  : '<tr><td colspan="5" class="text-center py-4 text-muted">No hay maestros registrados</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
  
  addTeachersEventListeners(teachers || [])
}

/**
 * Renderiza una fila de maestro en la tabla
 */
function renderTeacherRow(teacher) {
  const fullName = [
    teacher.primer_nombre,
    teacher.segundo_nombre,
    teacher.apellido_paterno,
    teacher.apellido_materno
  ].filter(Boolean).join(' ')
  
  const statusBadge = teacher.activo 
    ? '<span class="badge bg-success">Activo</span>'
    : '<span class="badge bg-secondary">Inactivo</span>'
  
  return `
    <tr data-teacher-id="${teacher.id}">
      <td>
        <div class="fw-bold">${fullName}</div>
        <small class="text-muted">ID: ${teacher.id.substring(0, 8)}...</small>
      </td>
      <td>${teacher.email || 'No especificado'}</td>
      <td>${teacher.telefono || 'No especificado'}</td>
      <td>${statusBadge}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-light view-teacher" data-id="${teacher.id}">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-light edit-teacher" data-id="${teacher.id}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-light delete-teacher" data-id="${teacher.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
}

/**
 * Event listeners para la vista de maestros
 */
function addTeachersEventListeners(teachers) {
  // Botón agregar maestro
  const addTeacherBtn = document.getElementById('addTeacherBtn')
  addTeacherBtn?.addEventListener('click', () => {
    openTeacherModal()
  })
  
  // Búsqueda
  const searchInput = document.getElementById('searchTeacher')
  const filterStatus = document.getElementById('filterStatus')
  const clearFiltersBtn = document.getElementById('clearFilters')
  
  const applyFilters = () => {
    const searchTerm = searchInput.value.toLowerCase()
    const status = filterStatus.value
    
    const filtered = teachers.filter(teacher => {
      const fullName = [teacher.primer_nombre, teacher.segundo_nombre, teacher.apellido_paterno, teacher.apellido_materno]
        .filter(Boolean).join(' ').toLowerCase()
      const matchSearch = searchTerm === '' || 
        fullName.includes(searchTerm) || 
        teacher.email?.toLowerCase().includes(searchTerm)
      const matchStatus = status === '' || teacher.activo.toString() === status
      
      return matchSearch && matchStatus
    })
    
    updateTableRows(filtered)
  }
  
  searchInput?.addEventListener('input', applyFilters)
  filterStatus?.addEventListener('change', applyFilters)
  
  clearFiltersBtn?.addEventListener('click', () => {
    searchInput.value = ''
    filterStatus.value = ''
    updateTableRows(teachers)
  })
  
  // Event listeners para botones de acción
  document.querySelectorAll('.view-teacher').forEach(btn => {
    btn.addEventListener('click', () => viewTeacherDetails(btn.getAttribute('data-id')))
  })
  
  document.querySelectorAll('.edit-teacher').forEach(btn => {
    btn.addEventListener('click', async () => {
      const teacherId = btn.getAttribute('data-id')
      const { data: teacher } = await supabase.from('profiles').select('*').eq('id', teacherId).single()
      if (teacher) openTeacherModal(teacher)
    })
  })
  
  document.querySelectorAll('.delete-teacher').forEach(btn => {
    btn.addEventListener('click', () => deleteTeacher(btn.getAttribute('data-id')))
  })
}

/**
 * Actualiza las filas de la tabla
 */
function updateTableRows(teachers) {
  const tbody = document.getElementById('teachersTableBody')
  if (!tbody) return
  
  if (teachers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No se encontraron maestros</td></tr>'
  } else {
    tbody.innerHTML = teachers.map(teacher => renderTeacherRow(teacher)).join('')
    
    // Re-agregar event listeners
    document.querySelectorAll('.view-teacher').forEach(btn => {
      btn.addEventListener('click', () => viewTeacherDetails(btn.getAttribute('data-id')))
    })
    
    document.querySelectorAll('.edit-teacher').forEach(btn => {
      btn.addEventListener('click', async () => {
        const teacherId = btn.getAttribute('data-id')
        const { data: teacher } = await supabase.from('profiles').select('*').eq('id', teacherId).single()
        if (teacher) openTeacherModal(teacher)
      })
    })
    
    document.querySelectorAll('.delete-teacher').forEach(btn => {
      btn.addEventListener('click', () => deleteTeacher(btn.getAttribute('data-id')))
    })
  }
}

/**
 * Abre el modal para crear/editar maestro
 */
function openTeacherModal(teacher = null) {
  const isEdit = !!teacher
  const modalTitle = isEdit ? 'Editar Maestro' : 'Nuevo Maestro'
  
  const modalHTML = `
    <style>
      #teacherModal .form-control,
      #teacherModal .form-select {
        padding: 0.625rem 0.875rem;
        font-size: 1rem;
      }
      #teacherModal .form-label {
        font-size: 0.95rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
    </style>
    <div class="modal-backdrop show"></div>
    <div class="modal show d-block" id="teacherModal" tabindex="-1">
      <div class="modal-dialog modal-xl" style="max-width: 1400px;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${modalTitle}</h5>
            <button type="button" class="btn-close" id="closeModal"></button>
          </div>
          <div class="modal-body" style="padding: 2rem;">
            <form id="teacherForm">
              <div class="row g-4">
                <!-- INFORMACIÓN PERSONAL -->
                <div class="col-12">
                  <h6 class="text-primary border-bottom pb-2 mb-3">
                    <i class="bi bi-person me-2"></i>Información Personal
                  </h6>
                </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Primer Nombre *</label>
                      <input type="text" class="form-control" id="primerNombre" 
                        value="${teacher?.primer_nombre || ''}" required>
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Segundo Nombre</label>
                      <input type="text" class="form-control" id="segundoNombre" 
                        value="${teacher?.segundo_nombre || ''}">
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Apellido Paterno *</label>
                      <input type="text" class="form-control" id="apellidoPaterno" 
                        value="${teacher?.apellido_paterno || ''}" required>
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Apellido Materno</label>
                      <input type="text" class="form-control" id="apellidoMaterno" 
                        value="${teacher?.apellido_materno || ''}">
                    </div>
                    
                    <div class="col-md-4">
                      <label class="form-label">DNI / Identidad *</label>
                      <input type="text" class="form-control" id="dni" 
                        value="${teacher?.dni || ''}" required
                        placeholder="Ej: 0801199012345">
                    </div>
                    
                    <div class="col-md-4">
                      <label class="form-label">Fecha de Nacimiento *</label>
                      <input type="date" class="form-control" id="fechaNacimiento" 
                        value="${teacher?.fecha_nacimiento || ''}" required>
                    </div>
                    
                    <div class="col-md-4">
                      <label class="form-label">Género *</label>
                      <select class="form-control" id="genero" required>
                        <option value="">Seleccionar...</option>
                        <option value="masculino" ${teacher?.genero === 'masculino' ? 'selected' : ''}>Masculino</option>
                        <option value="femenino" ${teacher?.genero === 'femenino' ? 'selected' : ''}>Femenino</option>
                        <option value="otro" ${teacher?.genero === 'otro' ? 'selected' : ''}>Otro</option>
                        <option value="prefiero_no_decir" ${teacher?.genero === 'prefiero_no_decir' ? 'selected' : ''}>Prefiero no decir</option>
                      </select>
                    </div>
                    
                    <div class="col-12 mt-4">
                      <h6 class="text-primary mb-3">Información de Contacto</h6>
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Email ${isEdit ? '' : '*'}</label>
                      <input type="email" class="form-control" id="email" 
                        value="${teacher?.email || ''}" 
                        ${isEdit ? 'readonly' : 'required'}>
                      ${isEdit ? '<small class="text-muted">El email no puede modificarse</small>' : ''}
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Teléfono *</label>
                      <input type="tel" class="form-control" id="telefono" 
                        value="${teacher?.telefono || ''}" required
                        placeholder="Ej: +504 1234-5678">
                    </div>
                    
                    <div class="col-12">
                      <label class="form-label">Dirección *</label>
                      <textarea class="form-control" id="direccion" rows="2" 
                        placeholder="Dirección completa..." required>${teacher?.direccion || ''}</textarea>
                    </div>
                
                <!-- INFORMACIÓN ACADÉMICA -->
                <div class="col-12 mt-5">
                  <h6 class="text-primary border-bottom pb-2 mb-3">
                    <i class="bi bi-mortarboard me-2"></i>Información Académica
                  </h6>
                </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Título Académico *</label>
                      <input type="text" class="form-control" id="tituloAcademico" 
                        value="${teacher?.titulo_academico || ''}" required
                        placeholder="Ej: Ingeniero en Sistemas Computacionales">
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Grado Académico *</label>
                      <select class="form-control" id="gradoAcademico" required>
                        <option value="">Seleccionar...</option>
                        <option value="licenciatura" ${teacher?.grado_academico === 'licenciatura' ? 'selected' : ''}>Licenciatura</option>
                        <option value="maestria" ${teacher?.grado_academico === 'maestria' ? 'selected' : ''}>Maestría</option>
                        <option value="doctorado" ${teacher?.grado_academico === 'doctorado' ? 'selected' : ''}>Doctorado</option>
                        <option value="posdoctorado" ${teacher?.grado_academico === 'posdoctorado' ? 'selected' : ''}>Posdoctorado</option>
                      </select>
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Especialidad *</label>
                      <input type="text" class="form-control" id="especialidad" 
                        value="${teacher?.especialidad || ''}" required
                        placeholder="Ej: Desarrollo de Software, Matemáticas Aplicadas">
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Años de Experiencia *</label>
                      <input type="number" class="form-control" id="aniosExperiencia" 
                        value="${teacher?.anios_experiencia || 0}" required min="0" max="50">
                    </div>
                  </div>
                </div>
                
                <!-- INFORMACIÓN LABORAL -->
                <div class="col-12 mt-5">
                  <h6 class="text-primary border-bottom pb-2 mb-3">
                    <i class="bi bi-briefcase me-2"></i>Información Laboral
                  </h6>
                <div class="col-md-6">
                      <label class="form-label">Departamento *</label>
                      <input type="text" class="form-control" id="departamento" 
                        value="${teacher?.departamento || ''}" required
                        placeholder="Ej: Ciencias de la Computación">
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Tipo de Contrato *</label>
                      <select class="form-control" id="tipoContrato" required>
                        <option value="">Seleccionar...</option>
                        <option value="tiempo_completo" ${teacher?.tipo_contrato === 'tiempo_completo' ? 'selected' : ''}>Tiempo Completo</option>
                        <option value="medio_tiempo" ${teacher?.tipo_contrato === 'medio_tiempo' ? 'selected' : ''}>Medio Tiempo</option>
                        <option value="por_horas" ${teacher?.tipo_contrato === 'por_horas' ? 'selected' : ''}>Por Horas</option>
                        <option value="temporal" ${teacher?.tipo_contrato === 'temporal' ? 'selected' : ''}>Temporal</option>
                      </select>
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Fecha de Contratación *</label>
                      <input type="date" class="form-control" id="fechaContratacion" 
                        value="${teacher?.fecha_contratacion || ''}" required>
                    </div>
                    
                    <div class="col-md-6">
                      <label class="form-label">Salario Mensual *</label>
                      <div class="input-group">
                        <span class="input-group-text">L.</span>
                        <input type="number" class="form-control" id="salario" 
                          value="${teacher?.salario || ''}" required min="0" step="0.01"
                          placeholder="0.00">
                      </div>
                    </div>
                    
                    <div class="col-12 mt-4">
                
                <!-- ESTADO -->
                <div class="col-12 mt-5">
                  <h6 class="text-primary border-bottom pb-2 mb-3">
                    <i class="bi bi-toggle-on me-2"></i>Estado
                  </h6>
                </div>
                
                <div class="col-md-12">
                  <label class="form-label">Estado *</label>
                  <select class="form-control" id="teacherStatus" required>
                    <option value="true" ${teacher?.activo !== false ? 'selected' : ''}>Activo</option>
                    <option value="false" ${teacher?.activo === false ? 'selected' : ''}>Inactivo</option>
                  </select
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelModal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveTeacher">
              <i class="bi bi-check-circle me-1"></i>
              ${isEdit ? 'Guardar Cambios' : 'Crear Maestro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHTML)
  
  // Event listeners del modal
  document.getElementById('closeModal')?.addEventListener('click', closeModal)
  document.getElementById('cancelModal')?.addEventListener('click', closeModal)
  document.getElementById('saveTeacher')?.addEventListener('click', () => saveTeacher(teacher?.id))
}

/**
 * Cierra el modal
 */
function closeModal() {
  document.querySelector('.modal')?.remove()
  document.querySelector('.modal-backdrop')?.remove()
}

/**
 * Guarda el maestro (crear o actualizar)
 */
async function saveTeacher(teacherId = null) {
  const form = document.getElementById('teacherForm')
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }
  
  // Obtener usuario actual para auditoría
  const { data: { user } } = await supabase.auth.getUser()
  
  const teacherData = {
    // Información personal
    primer_nombre: document.getElementById('primerNombre')?.value,
    segundo_nombre: document.getElementById('segundoNombre')?.value || null,
    apellido_paterno: document.getElementById('apellidoPaterno')?.value,
    apellido_materno: document.getElementById('apellidoMaterno')?.value || null,
    dni: document.getElementById('dni')?.value,
    fecha_nacimiento: document.getElementById('fechaNacimiento')?.value,
    genero: document.getElementById('genero')?.value,
    email: document.getElementById('email')?.value,
    telefono: document.getElementById('telefono')?.value,
    direccion: document.getElementById('direccion')?.value,
    
    // Información académica
    titulo_academico: document.getElementById('tituloAcademico')?.value,
    grado_academico: document.getElementById('gradoAcademico')?.value,
    especialidad: document.getElementById('especialidad')?.value,
    anios_experiencia: parseInt(document.getElementById('aniosExperiencia')?.value) || 0,
    
    // Información laboral
    departamento: document.getElementById('departamento')?.value,
    tipo_contrato: document.getElementById('tipoContrato')?.value,
    fecha_contratacion: document.getElementById('fechaContratacion')?.value,
    salario: parseFloat(document.getElementById('salario')?.value) || 0,
    
    activo: document.getElementById('teacherStatus')?.value === 'true',
    rol: 'teacher'
  }
  
  // Construir nombre completo (campo requerido en profiles)
  teacherData.nombre = [
    teacherData.primer_nombre,
    teacherData.segundo_nombre,
    teacherData.apellido_paterno,
    teacherData.apellido_materno
  ].filter(Boolean).join(' ')
  
  try {
    if (teacherId) {
      // Actualizar maestro existente
      teacherData.updated_by = user?.id
      
      const { error } = await supabase
        .from('profiles')
        .update(teacherData)
        .eq('id', teacherId)
      
      if (error) throw error
      showSuccessNotification('Maestro actualizado exitosamente', teacherData.nombre)
    } else {
      // Crear nuevo perfil de maestro (SIN autenticación por ahora)
      // Generar UUID para el nuevo perfil
      teacherData.id = crypto.randomUUID()
      teacherData.created_by = user?.id
      
      const { error } = await supabase
        .from('profiles')
        .insert([teacherData])
      
      if (error) throw error
      
      showSuccessNotification('Maestro creado exitosamente', teacherData.nombre)
    }
    
    closeModal()
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderTeachersView(mainContent)
    }
  } catch (error) {
    console.error('Error guardando maestro:', error)
    alert('Error al guardar el maestro: ' + error.message)
  }
}

/**
 * Ver detalles del maestro
 */
async function viewTeacherDetails(teacherId) {
  const { data: teacher, error } = await supabase
    .from('profiles')
    .select(`
      *,
      created_by_profile:created_by(primer_nombre, apellido_paterno),
      updated_by_profile:updated_by(primer_nombre, apellido_paterno)
    `)
    .eq('id', teacherId)
    .single()
  
  if (error || !teacher) {
    console.error('Error cargando detalles:', error)
    alert('Error cargando los detalles del maestro')
    return
  }
  
  openTeacherDetailsModal(teacher)
}

/**
 * Abre modal de detalles del maestro
 */
function openTeacherDetailsModal(teacher) {
  const fullName = [teacher.primer_nombre, teacher.segundo_nombre, teacher.apellido_paterno, teacher.apellido_materno]
    .filter(Boolean).join(' ')
  
  const generoLabels = {
    masculino: 'Masculino',
    femenino: 'Femenino',
    otro: 'Otro',
    prefiero_no_decir: 'Prefiero no decir'
  }
  
  const gradoLabels = {
    licenciatura: 'Licenciatura',
    maestria: 'Maestría',
    doctorado: 'Doctorado',
    posdoctorado: 'Posdoctorado'
  }
  
  const contratoLabels = {
    tiempo_completo: 'Tiempo Completo',
    medio_tiempo: 'Medio Tiempo',
    por_horas: 'Por Horas',
    temporal: 'Temporal'
  }
  
  const createdBy = teacher.created_by_profile 
    ? `${teacher.created_by_profile.primer_nombre} ${teacher.created_by_profile.apellido_paterno}`
    : 'Sistema'
  
  const updatedBy = teacher.updated_by_profile
    ? `${teacher.updated_by_profile.primer_nombre} ${teacher.updated_by_profile.apellido_paterno}`
    : 'N/A'
  
  const modalHTML = `
    <div class="modal-backdrop show"></div>
    <div class="modal show d-block" id="teacherDetailsModal" tabindex="-1">
      <div class="modal-dialog modal-xl" style="max-width: 1200px;">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h5 class="modal-title mb-1">Detalles del Maestro</h5>
              <p class="text-muted mb-0 small">${fullName}</p>
            </div>
            <button type="button" class="btn-close" id="closeDetailsModal"></button>
          </div>
          <div class="modal-body" style="padding: 2rem;">
            <div class="row g-4">
              <!-- INFORMACIÓN PERSONAL -->
              <div class="col-12">
                <h6 class="text-primary border-bottom pb-2 mb-3">
                  <i class="bi bi-person me-2"></i>Información Personal
                </h6>
              </div>
                  <div class="col-md-6">
                    <label class="text-muted small">DNI / Identidad</label>
                    <p class="fw-bold">${teacher.dni || 'No especificado'}</p>
                  </div>
                  
                  <div class="col-md-6">
                    <label class="text-muted small">Fecha de Nacimiento</label>
                    <p>${teacher.fecha_nacimiento ? new Date(teacher.fecha_nacimiento).toLocaleDateString('es-MX') : 'No especificada'}</p>
                  </div>
                  
                  <div class="col-md-6">
                    <label class="text-muted small">Género</label>
                    <p>${teacher.genero ? generoLabels[teacher.genero] : 'No especificado'}</p>
                  </div>
                  
                  <div class="col-md-6">
                    <label class="text-muted small">Email</label>
                    <p>${teacher.email || 'No especificado'}</p>
                  </div>
                  
                  <div class="col-md-6">
                    <label class="text-muted small">Teléfono</label>
                    <p>${teacher.telefono || 'No especificado'}</p>
                  </div>
                  
                  <div class="col-12">
                    <label class="text-muted small">Dirección</label>
                    <p>${teacher.direccion || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              
              <!-- INFORMACIÓN ACADÉMICA -->
              <div class="col-12 mt-5">
                <h6 class="text-primary border-bottom pb-2 mb-3">
                  <i class="bi bi-mortarboard me-2"></i>Información Académica
                </h6>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Título Académico</label>
                <p class="fw-bold">${teacher.titulo_academico || 'No especificado'}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Grado Académico</label>
                <p>${teacher.grado_academico ? gradoLabels[teacher.grado_academico] : 'No especificado'}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Especialidad</label>
                <p>${teacher.especialidad || 'No especificada'}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Años de Experiencia</label>
                <p>${teacher.anios_experiencia || 0} años</p>
              </div>
              
              <!-- INFORMACIÓN LABORAL -->
              <div class="col-12 mt-5">
                <h6 class="text-primary border-bottom pb-2 mb-3">
                  <i class="bi bi-briefcase me-2"></i>Información Laboral
                </h6>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Departamento</label>
                <p class="fw-bold">${teacher.departamento || 'No especificado'}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Tipo de Contrato</label>
                <p>${teacher.tipo_contrato ? contratoLabels[teacher.tipo_contrato] : 'No especificado'}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Fecha de Contratación</label>
                <p>${teacher.fecha_contratacion ? new Date(teacher.fecha_contratacion).toLocaleDateString('es-MX') : 'No especificada'}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Salario Mensual</label>
                <p class="fw-bold">L. ${teacher.salario ? parseFloat(teacher.salario).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Estado</label>
                <p>
                  ${teacher.activo 
                    ? '<span class="badge bg-success">Activo</span>'
                    : '<span class="badge bg-secondary">Inactivo</span>'
                  }
                </p>
              </div>
              
              <!-- AUDITORÍA -->
              <div class="col-12 mt-5">
                <h6 class="text-primary border-bottom pb-2 mb-3">
                  <i class="bi bi-clock-history me-2"></i>Auditoría
                </h6>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Fecha de Creación</label>
                <p>${new Date(teacher.created_at).toLocaleString('es-MX')}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Creado Por</label>
                <p class="fw-bold">${createdBy}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Última Actualización</label>
                <p>${new Date(teacher.updated_at).toLocaleString('es-MX')}</p>
              </div>
              
              <div class="col-md-6">
                <label class="text-muted small">Actualizado Por</label>
                <p class="fw-bold">${updatedBy}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="closeDetailsBtn">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHTML)
  
  document.getElementById('closeDetailsModal')?.addEventListener('click', closeDetailsModal)
  document.getElementById('closeDetailsBtn')?.addEventListener('click', closeDetailsModal)
}

/**
 * Cierra el modal de detalles
 */
function closeDetailsModal() {
  document.getElementById('teacherDetailsModal')?.remove()
  document.querySelector('.modal-backdrop')?.remove()
}

/**
 * Elimina un maestro
 */
async function deleteTeacher(teacherId) {
  if (!confirm('¿Estás seguro de eliminar este maestro? Esta acción no se puede deshacer.')) {
    return
  }
  
  try {
    // Solo desactivar el maestro en lugar de eliminarlo
    const { error } = await supabase
      .from('profiles')
      .update({ activo: false })
      .eq('id', teacherId)
    
    if (error) throw error
    
    alert('Maestro desactivado exitosamente')
    
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderTeachersView(mainContent)
    }
  } catch (error) {
    console.error('Error desactivando maestro:', error)
    alert('Error al desactivar el maestro: ' + error.message)
  }
}
