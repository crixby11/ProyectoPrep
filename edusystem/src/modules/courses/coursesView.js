import { supabase } from '../../lib/supabaseClient.js'

/**
 * Muestra una notificación de éxito bonita
 */
function showSuccessNotification(title, courseName) {
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
            <i class="bi bi-book me-1"></i>
            ${courseName}
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
 * Renderiza la vista de listado de cursos
 */
export async function renderCoursesView(container) {
  // Obtener cursos con sus secciones y maestros
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_sections (
        id,
        teacher_id,
        cupo_maximo,
        periodo,
        activo,
        profiles (
          id,
          primer_nombre,
          apellido_paterno
        ),
        schedules (
          dia_semana,
          hora_inicio,
          hora_fin
        )
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error cargando cursos:', error)
  }
  
  container.innerHTML = `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 font-bold mb-1">Gestión de Cursos</h1>
          <p class="text-muted text-sm mb-0">Administra todos los cursos de la institución</p>
        </div>
        <button class="btn btn-primary" id="addCourseBtn">
          <i class="bi bi-plus-circle me-2"></i>
          Nuevo Curso
        </button>
      </div>
      
      <!-- Filters -->
      <div class="dashboard-card mb-4">
        <div class="dashboard-card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <input type="text" class="form-control" id="searchInput" placeholder="Buscar curso...">
            </div>
            <div class="col-md-3">
              <select class="form-control" id="filterStatus">
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-control" id="filterLevel">
                <option value="">Todos los niveles</option>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-light w-100" id="clearFiltersBtn">
                <i class="bi bi-x-circle me-1"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="dashboard-row mb-4">
        <div class="dashboard-grid grid-cols-4">
          <div class="stats-card">
            <div class="stats-card-label">Total de Cursos</div>
            <div class="stats-card-value">${courses?.length || 0}</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Cursos Activos</div>
            <div class="stats-card-value">${courses?.filter(c => c.activo).length || 0}</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Cursos Inactivos</div>
            <div class="stats-card-value">${courses?.filter(c => !c.activo).length || 0}</div>
          </div>
          <div class="stats-card">
            <div class="stats-card-label">Total de Créditos</div>
            <div class="stats-card-value">${courses?.reduce((sum, c) => sum + (c.creditos || 0), 0) || 0}</div>
          </div>
        </div>
      </div>
      
      <!-- Courses Table -->
      <div class="dashboard-card">
        <div class="dashboard-card-header">
          <h5 class="dashboard-card-title">Listado de Cursos</h5>
        </div>
        <div class="dashboard-card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Maestro</th>
                  <th>Horario</th>
                  <th>Cupos</th>
                  <th>Modalidad</th>
                  <th>Visibilidad</th>
                  <th>Estado</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody id="coursesTableBody">
                ${courses && courses.length > 0 
                  ? courses.map(course => renderCourseRow(course)).join('') 
                  : '<tr><td colspan="9" class="text-center py-4 text-muted">No hay cursos registrados</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
  
  addCoursesEventListeners(courses || [])
}

/**
 * Renderiza una fila de curso en la tabla
 */
function renderCourseRow(course) {
  const section = course.course_sections?.[0]
  const teacher = section?.profiles
  const schedules = section?.schedules || []
  
  const teacherName = teacher 
    ? `${teacher.primer_nombre} ${teacher.apellido_paterno}`
    : 'Sin maestro'
  
  const scheduleText = schedules.length > 0
    ? schedules.map(s => {
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        return `${dias[s.dia_semana]} ${s.hora_inicio.substring(0,5)}`
      }).join(', ')
    : 'Sin horario'
  
  const cupos = section?.cupo_maximo || 0
  
  const statusBadge = course.activo 
    ? '<span class="badge bg-success">Activo</span>'
    : '<span class="badge bg-secondary">Inactivo</span>'
  
  const visibilityBadge = course.visible
    ? '<span class="badge bg-info">Visible</span>'
    : '<span class="badge bg-warning">Oculto</span>'
  
  const modalidadBadges = {
    'presencial': '<span class="badge bg-primary">Presencial</span>',
    'virtual': '<span class="badge bg-success">Virtual</span>',
    'hibrido': '<span class="badge bg-warning">Híbrido</span>'
  }
  const modalidadBadge = modalidadBadges[section?.modalidad] || '<span class="badge bg-secondary">-</span>'
  
  return `
    <tr data-course-id="${course.id}">
      <td><strong>${course.codigo || 'Auto'}</strong></td>
      <td>
        <div class="fw-bold">${course.nombre}</div>
        <small class="text-muted">${course.creditos || 0} créditos</small>
      </td>
      <td>${teacherName}</td>
      <td><small>${scheduleText}</small></td>
      <td>${cupos}</td>
      <td>${modalidadBadge}</td>
      <td>${visibilityBadge}</td>
      <td>${statusBadge}</td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-light view-course" data-id="${course.id}">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-light edit-course" data-id="${course.id}">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-light delete-course" data-id="${course.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `
}

/**
 * Event listeners para la vista de cursos
 */
function addCoursesEventListeners(courses) {
  // Botón agregar curso
  const addCourseBtn = document.getElementById('addCourseBtn')
  addCourseBtn?.addEventListener('click', () => {
    openCourseModal()
  })
  
  // Botones de acción en la tabla
  document.querySelectorAll('.view-course').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id')
      viewCourseDetails(courseId)
    })
  })
  
  document.querySelectorAll('.edit-course').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id')
      const course = courses.find(c => c.id === courseId)
      openCourseModal(course)
    })
  })
  
  document.querySelectorAll('.delete-course').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-id')
      deleteCourse(courseId)
    })
  })
  
  // Búsqueda y filtros
  const searchInput = document.getElementById('searchInput')
  const filterStatus = document.getElementById('filterStatus')
  const filterLevel = document.getElementById('filterLevel')
  const clearFiltersBtn = document.getElementById('clearFiltersBtn')
  
  const applyFilters = () => {
    const searchTerm = searchInput.value.toLowerCase()
    const status = filterStatus.value
    const level = filterLevel.value
    
    let filtered = courses
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.nombre.toLowerCase().includes(searchTerm) ||
        c.codigo?.toLowerCase().includes(searchTerm) ||
        c.descripcion?.toLowerCase().includes(searchTerm)
      )
    }
    
    if (status) {
      filtered = filtered.filter(c => 
        status === 'activo' ? c.activo : !c.activo
      )
    }
    
    if (level) {
      filtered = filtered.filter(c => c.nivel === level)
    }
    
    updateTableRows(filtered)
  }
  
  searchInput?.addEventListener('input', applyFilters)
  filterStatus?.addEventListener('change', applyFilters)
  filterLevel?.addEventListener('change', applyFilters)
  
  clearFiltersBtn?.addEventListener('click', () => {
    searchInput.value = ''
    filterStatus.value = ''
    filterLevel.value = ''
    updateTableRows(courses)
  })
}

/**
 * Actualiza las filas de la tabla
 */
function updateTableRows(courses) {
  const tbody = document.getElementById('coursesTableBody')
  if (!tbody) return
  
  if (courses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No se encontraron cursos</td></tr>'
  } else {
    tbody.innerHTML = courses.map(course => renderCourseRow(course)).join('')
    
    // Re-agregar event listeners
    document.querySelectorAll('.view-course').forEach(btn => {
      btn.addEventListener('click', () => viewCourseDetails(btn.getAttribute('data-id')))
    })
    
    document.querySelectorAll('.edit-course').forEach(btn => {
      btn.addEventListener('click', async () => {
        const courseId = btn.getAttribute('data-id')
        const { data: course } = await supabase.from('courses').select(`
          *,
          course_sections (*, profiles(*), schedules(*))
        `).eq('id', courseId).single()
        if (course) openCourseModal(course)
      })
    })
    
    document.querySelectorAll('.delete-course').forEach(btn => {
      btn.addEventListener('click', () => deleteCourse(btn.getAttribute('data-id')))
    })
  }
}

/**
 * Abre el modal para crear/editar curso
 */
async function openCourseModal(course = null) {
  const isEdit = !!course
  const modalTitle = isEdit ? 'Editar Curso' : 'Nuevo Curso'
  
  // Obtener lista de maestros
  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, primer_nombre, segundo_nombre, apellido_paterno, apellido_materno')
    .eq('rol', 'teacher')
    .eq('activo', true)
    .order('primer_nombre')
  
  // Si es edición, obtener la sección y horarios
  let section = null
  let schedules = []
  if (isEdit && course.course_sections?.[0]) {
    section = course.course_sections[0]
    schedules = section.schedules || []
  }
  
  const modalHTML = `
    <style>
      #courseModal .form-control,
      #courseModal .form-select {
        padding: 0.625rem 0.875rem;
        font-size: 1rem;
      }
      #courseModal .form-label {
        font-size: 0.95rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
    </style>
    <div class="modal-backdrop show"></div>
    <div class="modal show d-block" id="courseModal" tabindex="-1">
      <div class="modal-dialog modal-xl" style="max-width: 1400px;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${modalTitle}</h5>
            <button type="button" class="btn-close" id="closeModal"></button>
          </div>
          <div class="modal-body" style="padding: 2rem;">
            <form id="courseForm">
              <div class="row g-4">
                <!-- Información del Curso -->
                <div class="col-12">
                  <h6 class="border-bottom pb-2 mb-3">Información del Curso</h6>
                </div>
                
                <div class="col-md-4">
                  <label class="form-label">Código</label>
                  <input type="text" class="form-control" id="courseCode" 
                    value="${course?.codigo || ''}" 
                    placeholder="Se genera automáticamente" 
                    ${isEdit ? 'readonly' : 'disabled'}>
                  <small class="text-muted">El código se genera automáticamente</small>
                </div>
                
                <div class="col-md-8">
                  <label class="form-label">Nombre del Curso *</label>
                  <input type="text" class="form-control" id="courseName" 
                    value="${course?.nombre || ''}" 
                    placeholder="Ej: Matemáticas Avanzadas" 
                    required>
                </div>
                
                <div class="col-12">
                  <label class="form-label">Descripción</label>
                  <textarea class="form-control" id="courseDescription" rows="2" 
                    placeholder="Descripción del curso...">${course?.descripcion || ''}</textarea>
                </div>
                
                <div class="col-md-3">
                  <label class="form-label">Créditos *</label>
                  <input type="number" class="form-control" id="courseCredits" 
                    value="${course?.creditos || 3}" min="1" max="10" required>
                </div>
                
                <div class="col-md-3">
                  <label class="form-label">Nivel *</label>
                  <select class="form-control" id="courseLevel" required>
                    <option value="">Selecciona...</option>
                    <option value="basico" ${course?.nivel === 'basico' ? 'selected' : ''}>Básico</option>
                    <option value="intermedio" ${course?.nivel === 'intermedio' ? 'selected' : ''}>Intermedio</option>
                    <option value="avanzado" ${course?.nivel === 'avanzado' ? 'selected' : ''}>Avanzado</option>
                  </select>
                </div>
                
                <div class="col-md-3">
                  <label class="form-label">Cupos *</label>
                  <input type="number" class="form-control" id="courseCupos" 
                    value="${section?.cupo_maximo || 30}" min="5" max="100" required>
                  <small class="text-muted">Máximo de estudiantes</small>
                </div>
                
                <div class="col-md-3">
                  <label class="form-label">Visibilidad *</label>
                  <select class="form-control" id="courseVisible" required>
                    <option value="true" ${course?.visible !== false ? 'selected' : ''}>Visible</option>
                    <option value="false" ${course?.visible === false ? 'selected' : ''}>Oculto</option>
                  </select>
                </div>
                
                <!-- Modalidad y Ubicación -->
                <div class="col-12 mt-3">
                  <h6 class="border-bottom pb-2 mb-3">Modalidad y Ubicación</h6>
                </div>
                
                <div class="col-md-4">
                  <label class="form-label">Modalidad *</label>
                  <select class="form-control" id="courseModalidad" required>
                    <option value="presencial" ${section?.modalidad === 'presencial' || !section ? 'selected' : ''}>Presencial</option>
                    <option value="virtual" ${section?.modalidad === 'virtual' ? 'selected' : ''}>Virtual</option>
                    <option value="hibrido" ${section?.modalidad === 'hibrido' ? 'selected' : ''}>Híbrido</option>
                  </select>
                </div>
                
                <div class="col-md-8">
                  <label class="form-label">Ubicación *</label>
                  <input type="text" class="form-control" id="courseUbicacion" 
                    value="${section?.ubicacion || ''}" 
                    placeholder="Aula 101 o enlace de reunión virtual" 
                    required>
                  <small class="text-muted" id="ubicacionHint">Para presencial: número de aula. Para virtual: enlace de la reunión</small>
                </div>
                
                <!-- Asignación de Maestro -->
                <div class="col-12 mt-4">
                  <h6 class="border-bottom pb-2 mb-3">Asignación de Maestro</h6>
                </div>
                
                <div class="col-md-6">
                  <label class="form-label">Maestro Asignado *</label>
                  <select class="form-control" id="courseTeacher" required>
                    <option value="">Selecciona un maestro...</option>
                    ${teachers?.map(t => {
                      const fullName = [t.primer_nombre, t.segundo_nombre, t.apellido_paterno, t.apellido_materno]
                        .filter(Boolean).join(' ')
                      return `<option value="${t.id}" ${section?.teacher_id === t.id ? 'selected' : ''}>${fullName}</option>`
                    }).join('') || '<option value="">No hay maestros disponibles</option>'}
                  </select>
                </div>
                
                <div class="col-md-6">
                  <label class="form-label">Estado *</label>
                  <select class="form-control" id="courseStatus" required>
                    <option value="true" ${course?.activo !== false ? 'selected' : ''}>Activo</option>
                    <option value="false" ${course?.activo === false ? 'selected' : ''}>Inactivo</option>
                  </select>
                </div>
                
                <!-- Horarios -->
                <div class="col-12 mt-4">
                  <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                    <h6 class="mb-0">Horarios de Clase</h6>
                    <button type="button" class="btn btn-sm btn-primary" id="addScheduleBtn">
                      <i class="bi bi-plus-circle me-1"></i>
                      Agregar Horario
                    </button>
                  </div>
                </div>
                
                <div class="col-12" id="schedulesContainer">
                  ${schedules.map((s, i) => renderScheduleRow(s, i)).join('') || renderScheduleRow(null, 0)}
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelModal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveCourse">
              <i class="bi bi-check-circle me-1"></i>
              ${isEdit ? 'Guardar Cambios' : 'Crear Curso'}
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
  document.getElementById('saveCourse')?.addEventListener('click', () => saveCourse(course?.id))
  document.getElementById('addScheduleBtn')?.addEventListener('click', addScheduleRow)
  
  // Event listener para cambiar placeholder según modalidad
  document.getElementById('courseModalidad')?.addEventListener('change', (e) => {
    const ubicacionInput = document.getElementById('courseUbicacion')
    const hint = document.getElementById('ubicacionHint')
    const modalidad = e.target.value
    
    if (modalidad === 'presencial') {
      ubicacionInput.placeholder = 'Ej: Aula 101, Edificio A'
      hint.textContent = 'Especifica el aula o salón'
    } else if (modalidad === 'virtual') {
      ubicacionInput.placeholder = 'Ej: https://meet.google.com/abc-defg-hij'
      hint.textContent = 'Proporciona el enlace de la reunión virtual'
    } else {
      ubicacionInput.placeholder = 'Ej: Aula 101 / https://meet.google.com/abc-defg-hij'
      hint.textContent = 'Especifica aula para clases presenciales y enlace para sesiones virtuales'
    }
  })
  
  // Event listeners para eliminar horarios
  document.querySelectorAll('.remove-schedule').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.schedule-row').remove()
    })
  })
}

/**
 * Renderiza una fila de horario
 */
function renderScheduleRow(schedule = null, index = 0) {
  const dias = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' }
  ]
  
  return `
    <div class="schedule-row row g-2 mb-2 p-2 border rounded" data-index="${index}">
      <div class="col-md-4">
        <select class="form-control schedule-day" required>
          <option value="">Día...</option>
          ${dias.map(d => `<option value="${d.value}" ${schedule?.dia_semana === d.value ? 'selected' : ''}>${d.label}</option>`).join('')}
        </select>
      </div>
      <div class="col-md-3">
        <input type="time" class="form-control schedule-start" 
          value="${schedule?.hora_inicio || '08:00'}" required>
      </div>
      <div class="col-md-3">
        <input type="time" class="form-control schedule-end" 
          value="${schedule?.hora_fin || '10:00'}" required>
      </div>
      <div class="col-md-2">
        <button type="button" class="btn btn-danger btn-sm w-100 remove-schedule">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `
}

/**
 * Agrega una nueva fila de horario
 */
function addScheduleRow() {
  const container = document.getElementById('schedulesContainer')
  const currentRows = container.querySelectorAll('.schedule-row').length
  const newRow = renderScheduleRow(null, currentRows)
  container.insertAdjacentHTML('beforeend', newRow)
  
  // Agregar event listener al botón de eliminar
  const newRowElement = container.lastElementChild
  newRowElement.querySelector('.remove-schedule')?.addEventListener('click', (e) => {
    e.target.closest('.schedule-row').remove()
  })
}

/**
 * Cierra el modal
 */
function closeModal() {
  document.querySelector('.modal')?.remove()
  document.querySelector('.modal-backdrop')?.remove()
}

/**
 * Guarda un curso (crear o actualizar)
 */
async function saveCourse(courseId = null) {
  const form = document.getElementById('courseForm')
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }
  
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    alert('No se pudo obtener el usuario actual')
    return
  }
  
  // Recopilar datos del curso
  const courseData = {
    nombre: document.getElementById('courseName')?.value,
    descripcion: document.getElementById('courseDescription')?.value,
    creditos: parseInt(document.getElementById('courseCredits')?.value),
    nivel: document.getElementById('courseLevel')?.value,
    activo: document.getElementById('courseStatus')?.value === 'true',
    visible: document.getElementById('courseVisible')?.value === 'true',
    modalidad: document.getElementById('courseModalidad')?.value
  }
  
  // Agregar campos de auditoría
  if (courseId) {
    courseData.updated_by = user.id
  } else {
    courseData.created_by = user.id
  }
  
  // Datos de la sección
  const teacherId = document.getElementById('courseTeacher')?.value
  const cupoMaximo = parseInt(document.getElementById('courseCupos')?.value)
  const modalidad = document.getElementById('courseModalidad')?.value
  const ubicacion = document.getElementById('courseUbicacion')?.value
  
  // Recopilar horarios
  const scheduleRows = document.querySelectorAll('.schedule-row')
  const schedules = []
  
  for (const row of scheduleRows) {
    const dia = row.querySelector('.schedule-day')?.value
    const inicio = row.querySelector('.schedule-start')?.value
    const fin = row.querySelector('.schedule-end')?.value
    
    if (dia && inicio && fin) {
      schedules.push({
        dia_semana: parseInt(dia),
        hora_inicio: inicio,
        hora_fin: fin
      })
    }
  }
  
  if (!teacherId) {
    alert('Debes seleccionar un maestro')
    return
  }
  
  if (schedules.length === 0) {
    alert('Debes agregar al menos un horario')
    return
  }
  
  try {
    let finalCourseId = courseId
    
    if (courseId) {
      // Actualizar curso existente
      const { error: courseError } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseId)
      
      if (courseError) throw courseError
      
      // Actualizar sección
      const { data: existingSection } = await supabase
        .from('course_sections')
        .select('id')
        .eq('course_id', courseId)
        .single()
      
      if (existingSection) {
        const { error: sectionError } = await supabase
          .from('course_sections')
          .update({
            teacher_id: teacherId,
            cupo_maximo: cupoMaximo,
            modalidad: modalidad,
            ubicacion: ubicacion,
            activo: courseData.activo
          })
          .eq('id', existingSection.id)
        
        if (sectionError) throw sectionError
        
        // Eliminar horarios antiguos
        await supabase
          .from('schedules')
          .delete()
          .eq('section_id', existingSection.id)
        
        // Insertar nuevos horarios
        const schedulesData = schedules.map(s => ({
          section_id: existingSection.id,
          ...s
        }))
        
        const { error: schedulesError } = await supabase
          .from('schedules')
          .insert(schedulesData)
        
        if (schedulesError) throw schedulesError
      }
      showSuccessNotification('Curso actualizado exitosamente', courseData.nombre)
    } else {
      // Crear nuevo curso
      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()
      
      if (courseError) throw courseError
      
      finalCourseId = newCourse.id
      
      // Crear sección
      const { data: newSection, error: sectionError } = await supabase
        .from('course_sections')
        .insert({
          course_id: finalCourseId,
          teacher_id: teacherId,
          nombre: 'Sección A',
          periodo: '2024-1',
          cupo_maximo: cupoMaximo,
          modalidad: modalidad,
          ubicacion: ubicacion,
          activo: true
        })
        .select()
        .single()
      
      if (sectionError) throw sectionError
      
      // Insertar horarios
      const schedulesData = schedules.map(s => ({
        section_id: newSection.id,
        ...s
      }))
      
      const { error: schedulesError } = await supabase
        .from('schedules')
        .insert(schedulesData)
      
      if (schedulesError) throw schedulesError
      showSuccessNotification('Curso creado exitosamente', courseData.nombre)
    }
    
    closeModal()
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderCoursesView(mainContent)
    }
  } catch (error) {
    console.error('Error guardando curso:', error)
    alert('Error al guardar el curso: ' + error.message)
  }
}

/**
 * Ver detalles del curso
 */
async function viewCourseDetails(courseId) {
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      course_sections (
        id,
        nombre
      )
    `)
    .eq('id', courseId)
    .single()
  
  if (error || !course) {
    console.error('Error cargando detalles:', error)
    alert('Error cargando los detalles del curso')
    return
  }
  
  // Si el curso tiene secciones, navegar a la vista detallada de la primera sección
  if (course.course_sections && course.course_sections.length > 0) {
    const firstSection = course.course_sections[0]
    // Navegar a la vista detallada del curso
    window.location.hash = `#/course/${firstSection.id}`
  } else {
    alert('Este curso no tiene secciones activas')
  }
}

/**
 * Elimina un curso
 */
async function deleteCourse(courseId) {
  if (!confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
    return
  }
  
  try {
    // Obtener el nombre del curso antes de eliminarlo
    const { data: course } = await supabase
      .from('courses')
      .select('nombre')
      .eq('id', courseId)
      .single()
    
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    
    if (error) throw error
    
    showSuccessNotification('Curso eliminado exitosamente', course?.nombre || 'Curso')
    
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderCoursesView(mainContent)
    }
  } catch (error) {
    console.error('Error eliminando curso:', error)
    alert('Error al eliminar el curso: ' + error.message)
  }
}
