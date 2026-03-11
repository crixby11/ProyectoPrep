import { supabase } from '../../lib/supabaseClient.js'

/**
 * Muestra una notificación de éxito
 */
function showSuccessNotification(title, details) {
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
            <i class="bi bi-card-checklist me-1"></i>
            ${details}
          </p>
        </div>
        <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.parentElement.remove()"></button>
      </div>
    </div>
  `
  
  document.body.appendChild(notification)
  
  setTimeout(() => {
    notification.style.animation = 'slideOutUp 0.3s ease-out'
    setTimeout(() => notification.remove(), 300)
  }, 4000)
}

/**
 * Renderiza la vista de inscripciones
 */
export async function renderEnrollmentsView(container) {
  // Cargar inscripciones con información relacionada
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:student_id (id, nombre, matricula, email),
      section:section_id (
        id, 
        nombre,
        course:course_id (id, nombre, codigo)
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error cargando inscripciones:', error)
  }
  
  container.innerHTML = `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Gestión de Inscripciones</h2>
          <p class="text-muted mb-0">Administra las inscripciones de estudiantes a cursos</p>
        </div>
        <button class="btn btn-primary" id="addEnrollmentBtn">
          <i class="bi bi-plus-circle me-2"></i>
          Nueva Inscripción
        </button>
      </div>
      
      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <input type="text" class="form-control" id="searchEnrollment" placeholder="Buscar por estudiante o curso...">
            </div>
            <div class="col-md-3">
              <select class="form-control" id="filterStatus">
                <option value="">Todos los estados</option>
                <option value="enrolled">Inscrito</option>
                <option value="completed">Completado</option>
                <option value="dropped">Retirado</option>
                <option value="withdrawn">Dado de baja</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" id="clearFilters">
                <i class="bi bi-x-circle me-1"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Total Inscripciones</p>
                  <h3 class="mb-0">${enrollments?.length || 0}</h3>
                </div>
                <div class="icon-box bg-primary bg-opacity-10 text-primary">
                  <i class="bi bi-card-checklist fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Activas</p>
                  <h3 class="mb-0">${enrollments?.filter(e => e.status === 'enrolled').length || 0}</h3>
                </div>
                <div class="icon-box bg-success bg-opacity-10 text-success">
                  <i class="bi bi-check-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Completadas</p>
                  <h3 class="mb-0">${enrollments?.filter(e => e.status === 'completed').length || 0}</h3>
                </div>
                <div class="icon-box bg-info bg-opacity-10 text-info">
                  <i class="bi bi-trophy fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Retiradas</p>
                  <h3 class="mb-0">${enrollments?.filter(e => e.status === 'dropped' || e.status === 'withdrawn').length || 0}</h3>
                </div>
                <div class="icon-box bg-warning bg-opacity-10 text-warning">
                  <i class="bi bi-exclamation-triangle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabla de Inscripciones -->
      <div class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Matrícula</th>
                  <th>Curso</th>
                  <th>Sección</th>
                  <th>Fecha Inscripción</th>
                  <th>Estado</th>
                  <th>Calif. Final</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="enrollmentsTableBody">
                ${enrollments && enrollments.length > 0 ? enrollments.map(enrollment => {
                  const statusBadges = {
                    enrolled: '<span class="badge bg-success">Inscrito</span>',
                    completed: '<span class="badge bg-info">Completado</span>',
                    dropped: '<span class="badge bg-warning">Retirado</span>',
                    withdrawn: '<span class="badge bg-danger">Dado de baja</span>'
                  }
                  return `
                    <tr>
                      <td>${enrollment.student?.nombre || 'No disponible'}</td>
                      <td><strong>${enrollment.student?.matricula || 'N/A'}</strong></td>
                      <td>${enrollment.section?.course?.nombre || 'No disponible'}</td>
                      <td><span class="badge bg-secondary">${enrollment.section?.nombre || 'N/A'}</span></td>
                      <td>${new Date(enrollment.enrollment_date).toLocaleDateString('es-HN')}</td>
                      <td>${statusBadges[enrollment.status] || enrollment.status}</td>
                      <td>${enrollment.final_grade ? `<span class="badge ${enrollment.final_grade >= 60 ? 'bg-success' : 'bg-danger'}">${enrollment.final_grade}</span>` : '<span class="text-muted">Pendiente</span>'}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="window.viewEnrollment('${enrollment.id}')">
                          <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning me-1" onclick="window.editEnrollment('${enrollment.id}')">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.deleteEnrollment('${enrollment.id}')">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  `
                }).join('') : '<tr><td colspan="8" class="text-center">No hay inscripciones registradas</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Event Listeners
  document.getElementById('addEnrollmentBtn')?.addEventListener('click', () => showEnrollmentModal())
  document.getElementById('searchEnrollment')?.addEventListener('input', filterEnrollments)
  document.getElementById('filterStatus')?.addEventListener('change', filterEnrollments)
  document.getElementById('clearFilters')?.addEventListener('click', clearFilters)
  
  // Exponer funciones globalmente
  window.viewEnrollment = viewEnrollmentDetails
  window.editEnrollment = editEnrollment
  window.deleteEnrollment = deleteEnrollment
}

/**
 * Filtrar inscripciones
 */
function filterEnrollments() {
  const searchTerm = document.getElementById('searchEnrollment')?.value.toLowerCase()
  const statusFilter = document.getElementById('filterStatus')?.value
  
  const rows = document.querySelectorAll('#enrollmentsTableBody tr')
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase()
    const matchesSearch = text.includes(searchTerm)
    const matchesStatus = !statusFilter || text.includes(statusFilter === 'enrolled' ? 'inscrito' : 
                                                        statusFilter === 'completed' ? 'completado' :
                                                        statusFilter === 'dropped' ? 'retirado' :
                                                        statusFilter === 'withdrawn' ? 'dado de baja' : '')
    
    row.style.display = matchesSearch && matchesStatus ? '' : 'none'
  })
}

/**
 * Limpiar filtros
 */
function clearFilters() {
  document.getElementById('searchEnrollment').value = ''
  document.getElementById('filterStatus').value = ''
  filterEnrollments()
}

/**
 * Mostrar modal para crear/editar inscripción
 */
async function showEnrollmentModal(enrollment = null) {
  // Cargar estudiantes y secciones
  const [studentsResponse, sectionsResponse] = await Promise.all([
    supabase.from('profiles').select('id, nombre, matricula').eq('rol', 'student').eq('activo', true).order('nombre'),
    supabase.from('course_sections').select('id, nombre, course:course_id(id, nombre, codigo)').order('nombre')
  ])
  
  const students = studentsResponse.data || []
  const sections = sectionsResponse.data || []
  
  const modalHtml = `
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-card-checklist me-2"></i>
              ${enrollment ? 'Editar Inscripción' : 'Nueva Inscripción'}
            </h5>
            <button type="button" class="btn-close" onclick="this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()"></button>
          </div>
          <div class="modal-body">
            <form id="enrollmentForm">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Estudiante *</label>
                  <select class="form-control" id="studentId" required ${enrollment ? 'disabled' : ''}>
                    <option value="">Seleccionar estudiante...</option>
                    ${students.map(s => `
                      <option value="${s.id}" ${enrollment?.student_id === s.id ? 'selected' : ''}>
                        ${s.matricula} - ${s.nombre}
                      </option>
                    `).join('')}
                  </select>
                  ${enrollment ? `<input type="hidden" id="studentIdHidden" value="${enrollment.student_id}">` : ''}
                </div>
                
                <div class="col-md-6">
                  <label class="form-label">Sección del Curso *</label>
                  <select class="form-control" id="sectionId" required ${enrollment ? 'disabled' : ''}>
                    <option value="">Seleccionar sección...</option>
                    ${sections.map(sec => `
                      <option value="${sec.id}" ${enrollment?.section_id === sec.id ? 'selected' : ''}>
                        ${sec.course?.codigo} - ${sec.course?.nombre} (${sec.nombre})
                      </option>
                    `).join('')}
                  </select>
                  ${enrollment ? `<input type="hidden" id="sectionIdHidden" value="${enrollment.section_id}">` : ''}
                </div>
                
                <div class="col-md-4">
                  <label class="form-label">Fecha de Inscripción *</label>
                  <input type="date" class="form-control" id="enrollmentDate" 
                    value="${enrollment?.enrollment_date || new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <div class="col-md-4">
                  <label class="form-label">Estado *</label>
                  <select class="form-control" id="enrollmentStatus" required>
                    <option value="enrolled" ${enrollment?.status === 'enrolled' ? 'selected' : ''}>Inscrito</option>
                    <option value="completed" ${enrollment?.status === 'completed' ? 'selected' : ''}>Completado</option>
                    <option value="dropped" ${enrollment?.status === 'dropped' ? 'selected' : ''}>Retirado</option>
                    <option value="withdrawn" ${enrollment?.status === 'withdrawn' ? 'selected' : ''}>Dado de baja</option>
                  </select>
                </div>
                
                <div class="col-md-4">
                  <label class="form-label">Calificación Final</label>
                  <input type="number" class="form-control" id="finalGrade" 
                    value="${enrollment?.final_grade || ''}"
                    step="0.01" min="0" max="100" placeholder="0.00">
                </div>
                
                <div class="col-12">
                  <label class="form-label">Notas</label>
                  <textarea class="form-control" id="enrollmentNotes" rows="3" 
                    placeholder="Notas adicionales sobre la inscripción...">${enrollment?.notes || ''}</textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveEnrollment">
              <i class="bi bi-save me-2"></i>Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  document.getElementById('saveEnrollment')?.addEventListener('click', () => saveEnrollment(enrollment?.id))
}

/**
 * Guardar inscripción
 */
async function saveEnrollment(enrollmentId = null) {
  const form = document.getElementById('enrollmentForm')
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const enrollmentData = {
    student_id: enrollmentId ? document.getElementById('studentIdHidden')?.value : document.getElementById('studentId')?.value,
    section_id: enrollmentId ? document.getElementById('sectionIdHidden')?.value : document.getElementById('sectionId')?.value,
    enrollment_date: document.getElementById('enrollmentDate')?.value,
    status: document.getElementById('enrollmentStatus')?.value,
    final_grade: parseFloat(document.getElementById('finalGrade')?.value) || null,
    notes: document.getElementById('enrollmentNotes')?.value || null
  }
  
  try {
    if (enrollmentId) {
      // Actualizar inscripción existente
      enrollmentData.updated_by = user?.id
      
      const { error } = await supabase
        .from('enrollments')
        .update(enrollmentData)
        .eq('id', enrollmentId)
      
      if (error) throw error
      showSuccessNotification('Inscripción actualizada exitosamente', 'Los cambios se han guardado correctamente')
    } else {
      // Crear nueva inscripción
      enrollmentData.created_by = user?.id
      
      const { error } = await supabase
        .from('enrollments')
        .insert([enrollmentData])
      
      if (error) throw error
      
      showSuccessNotification('Inscripción creada exitosamente', 'El estudiante ha sido inscrito correctamente')
    }
    
    closeModal()
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderEnrollmentsView(mainContent)
    }
  } catch (error) {
    console.error('Error guardando inscripción:', error)
    alert('Error al guardar la inscripción: ' + error.message)
  }
}

/**
 * Ver detalles de inscripción
 */
async function viewEnrollmentDetails(enrollmentId) {
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:student_id (id, nombre, matricula, email, telefono),
      section:section_id (
        id, 
        nombre,
        course:course_id (id, nombre, codigo, descripcion)
      )
    `)
    .eq('id', enrollmentId)
    .single()
  
  if (error || !enrollment) {
    console.error('Error cargando detalles:', error)
    alert('No se pudo cargar la información de la inscripción')
    return
  }
  
  const statusLabels = {
    enrolled: 'Inscrito',
    completed: 'Completado',
    dropped: 'Retirado',
    withdrawn: 'Dado de baja'
  }
  
  const modalHtml = `
    <div class="modal fade show" style="display: block;">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-card-checklist me-2"></i>
              Detalles de la Inscripción
            </h5>
            <button type="button" class="btn-close" onclick="this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-person me-2"></i>Información del Estudiante</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Nombre:</strong><br>${enrollment.student?.nombre || 'No disponible'}</p>
                    <p><strong>Matrícula:</strong> ${enrollment.student?.matricula || 'N/A'}</p>
                    <p><strong>Email:</strong> ${enrollment.student?.email || 'No especificado'}</p>
                    <p><strong>Teléfono:</strong> ${enrollment.student?.telefono || 'No especificado'}</p>
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-book me-2"></i>Información del Curso</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Curso:</strong><br>${enrollment.section?.course?.nombre || 'No disponible'}</p>
                    <p><strong>Código:</strong> ${enrollment.section?.course?.codigo || 'N/A'}</p>
                    <p><strong>Sección:</strong> ${enrollment.section?.nombre || 'N/A'}</p>
                    <p><strong>Descripción:</strong><br>${enrollment.section?.course?.descripcion || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              
              <div class="col-12">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Detalles de la Inscripción</h6>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-4">
                        <p><strong>Fecha de Inscripción:</strong><br>${new Date(enrollment.enrollment_date).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div class="col-md-4">
                        <p><strong>Estado:</strong><br><span class="badge ${enrollment.status === 'enrolled' ? 'bg-success' : enrollment.status === 'completed' ? 'bg-info' : 'bg-warning'}">${statusLabels[enrollment.status] || enrollment.status}</span></p>
                      </div>
                      <div class="col-md-4">
                        <p><strong>Calificación Final:</strong><br>${enrollment.final_grade ? `<span class="badge ${enrollment.final_grade >= 60 ? 'bg-success' : 'bg-danger'} fs-6">${enrollment.final_grade}</span>` : '<span class="text-muted">Pendiente</span>'}</p>
                      </div>
                    </div>
                    ${enrollment.notes ? `<p class="mt-3"><strong>Notas:</strong><br>${enrollment.notes}</p>` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()">Cerrar</button>
            <button type="button" class="btn btn-primary" onclick="window.editEnrollment('${enrollment.id}'); this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()">
              <i class="bi bi-pencil me-2"></i>Editar
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
}

/**
 * Editar inscripción
 */
async function editEnrollment(enrollmentId) {
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single()
  
  if (error || !enrollment) {
    console.error('Error cargando inscripción:', error)
    alert('No se pudo cargar la información de la inscripción')
    return
  }
  
  showEnrollmentModal(enrollment)
}

/**
 * Eliminar inscripción
 */
async function deleteEnrollment(enrollmentId) {
  if (!confirm('¿Estás seguro de eliminar esta inscripción? Esta acción no se puede deshacer.')) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId)
    
    if (error) throw error
    
    showSuccessNotification('Inscripción eliminada exitosamente', 'La inscripción ha sido eliminada del sistema')
    
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderEnrollmentsView(mainContent)
    }
  } catch (error) {
    console.error('Error eliminando inscripción:', error)
    alert('Error al eliminar la inscripción: ' + error.message)
  }
}

/**
 * Cerrar modal
 */
function closeModal() {
  document.querySelector('.modal')?.remove()
  document.querySelector('.modal-backdrop')?.remove()
}
