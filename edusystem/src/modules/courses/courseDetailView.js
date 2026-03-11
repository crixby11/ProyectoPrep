import { supabase } from '../../lib/supabaseClient.js'

/**
 * VISTA DETALLADA DEL CURSO
 * Diseño con sidebar lateral estilo Canvas LMS
 * Incluye: General, Estudiantes, Tareas, Calificaciones, Asistencia, Anuncios
 */

// Estado del curso actual
let currentCourse = null
let currentSection = null

/**
 * Renderiza la vista detallada del curso con la sección seleccionada
 */
export async function renderCourseDetailView(container, sectionId) {
  // Cargar información completa de la sección
  const { data: section, error } = await supabase
    .from('course_sections')
    .select(`
      *,
      course:courses (
        id,
        nombre,
        codigo,
        descripcion,
        creditos,
        nivel,
        departamento,
        activo
      ),
      teacher:profiles!course_sections_teacher_id_fkey (
        id,
        primer_nombre,
        segundo_nombre,
        apellido_paterno,
        apellido_materno,
        email,
        telefono
      ),
      schedules (
        id,
        dia_semana,
        hora_inicio,
        hora_fin,
        aula
      )
    `)
    .eq('id', sectionId)
    .single()

  if (error) {
    console.error('Error cargando sección:', error)
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar el curso
      </div>
    `
    return
  }

  currentSection = section
  currentCourse = section.course

  // Cargar estudiantes inscritos
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrollment_date,
      status,
      final_grade,
      student:profiles!enrollments_student_id_fkey (
        id,
        primer_nombre,
        apellido_paterno,
        matricula,
        email
      )
    `)
    .eq('section_id', sectionId)
    .eq('status', 'enrolled')

  const enrolledCount = enrollments?.length || 0

  // Renderizar vista sidebar
  renderSidebarLayout(container, section, enrolledCount)

  // Cargar vista General por defecto
  showTab('general')
}

/**
 * DISEÑO COMPACTO CON TABS
 */
function renderSidebarLayout(container, section, enrolledCount) {
  const teacher = section.teacher
  const teacherName = teacher 
    ? `${teacher.primer_nombre} ${teacher.apellido_paterno}` 
    : 'Sin asignar'

  container.innerHTML = `
    <div class="course-detail-view">
      <!-- Header Compacto -->
      <div class="bg-white border-bottom shadow-sm">
        <div class="d-flex align-items-center justify-content-between px-4 py-2">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary" onclick="window.courseDetailView.goBack()">
              <i class="bi bi-arrow-left"></i>
            </button>
            <div>
              <h5 class="mb-0" style="font-weight: 600; color: #2c3e50;">${section.course.nombre}</h5>
              <small class="text-muted">${section.course.codigo} • ${teacherName} • ${enrolledCount} estudiantes</small>
            </div>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="px-4">
          <ul class="nav nav-tabs border-0">
            <li class="nav-item">
              <a class="nav-link course-nav-item active" href="#" data-tab="general">
                <i class="bi bi-house-door-fill me-1"></i>Inicio
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link course-nav-item" href="#" data-tab="announcements">
                <i class="bi bi-megaphone-fill me-1"></i>Anuncios
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link course-nav-item" href="#" data-tab="modules">
                <i class="bi bi-folder-fill me-1"></i>Módulos
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link course-nav-item" href="#" data-tab="assignments">
                <i class="bi bi-file-text-fill me-1"></i>Tareas
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link course-nav-item" href="#" data-tab="grades">
                <i class="bi bi-bar-chart-fill me-1"></i>Calificaciones
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link course-nav-item" href="#" data-tab="attendance">
                <i class="bi bi-calendar-check-fill me-1"></i>Asistencia
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link course-nav-item" href="#" data-tab="students">
                <i class="bi bi-people-fill me-1"></i>Estudiantes
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Contenido -->
      <div id="course-tab-content" style="background: #f8f9fa;">
        <!-- El contenido se carga dinámicamente aquí -->
      </div>
    </div>

    <style>
      .course-nav-item {
        color: #6c757d;
        padding: 0.75rem 1rem;
        border: none;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        font-weight: 500;
        font-size: 0.875rem;
        background: transparent !important;
      }
      
      .course-nav-item:hover {
        color: #4a90e2;
        border-bottom-color: #d1e7ff;
        background: transparent !important;
      }
      
      .course-nav-item.active {
        color: #4a90e2;
        border-bottom-color: #4a90e2;
        background: transparent !important;
      }
    </style>
  `

  attachNavListeners()
}

/**
 * Adjunta listeners a los elementos de navegación del sidebar
 */
function attachNavListeners() {
  document.querySelectorAll('.course-nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const tab = e.currentTarget.dataset.tab
      
      // Actualizar active
      document.querySelectorAll('.course-nav-item').forEach(l => {
        l.classList.remove('active')
      })
      e.currentTarget.classList.add('active')
      
      showTab(tab)
    })
  })
}

/**
 * Muestra el contenido de la pestaña seleccionada
 */
async function showTab(tabName) {
  const contentDiv = document.getElementById('course-tab-content')
  
  switch(tabName) {
    case 'general':
      await renderGeneralTab(contentDiv)
      break
    case 'announcements':
      await renderAnnouncementsTab(contentDiv)
      break
    case 'modules':
      await renderModulesTab(contentDiv)
      break
    case 'assignments':
      await renderAssignmentsTab(contentDiv)
      break
    case 'grades':
      await renderGradesTab(contentDiv)
      break
    case 'attendance':
      await renderAttendanceTab(contentDiv)
      break
    case 'students':
      await renderStudentsTab(contentDiv)
      break
    default:
      contentDiv.innerHTML = '<p>Sección en construcción</p>'
  }
}

/**
 * TAB: General - Información del curso
 */
async function renderGeneralTab(container) {
  const course = currentCourse
  const section = currentSection
  const teacher = section.teacher
  
  // Formatear horarios con nombres de días
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const schedules = section.schedules || []
  const scheduleHTML = schedules.length > 0 
    ? schedules.map(s => `
        <div class="d-flex align-items-center justify-content-between mb-1">
          <div>
            <span class="badge bg-primary me-2" style="min-width: 80px;">${diasSemana[s.dia_semana]}</span>
            <span style="font-size: 0.9rem;">${s.hora_inicio.substring(0,5)} - ${s.hora_fin.substring(0,5)}</span>
          </div>
          ${s.aula ? `<span class="badge bg-secondary">${s.aula}</span>` : ''}
        </div>
      `).join('')
    : '<p class="text-muted small mb-0">No hay horarios definidos</p>'

  container.innerHTML = `
    <div class="p-4">
      <div class="row g-3">
        <!-- Columna Principal -->
        <div class="col-lg-8">
          <!-- Info del Curso -->
          <div class="card shadow-sm mb-3" style="border: none;">
            <div class="card-body p-3">
              <h5 class="mb-2" style="color: #2c3e50;">${course.nombre}</h5>
              <p class="text-muted mb-2" style="font-size: 0.9rem;"><i class="bi bi-bookmark me-1"></i>${course.codigo}</p>
              ${course.descripcion ? `<p class="mb-0" style="line-height: 1.5; color: #555; font-size: 0.9rem;">${course.descripcion}</p>` : ''}
            </div>
          </div>

          <!-- Detalles -->
          <div class="card shadow-sm" style="border: none;">
            <div class="card-body p-3">
              <h6 class="mb-3" style="color: #2c3e50;"><i class="bi bi-info-circle-fill me-2" style="color: #4a90e2;"></i>Detalles</h6>
              <div class="row g-2">
                <div class="col-md-6">
                  <small class="text-muted d-block mb-1">Departamento</small>
                  <div><i class="bi bi-building me-2" style="color: #4a90e2;"></i><strong style="font-size: 0.9rem;">${course.departamento || 'N/A'}</strong></div>
                </div>
                <div class="col-md-6">
                  <small class="text-muted d-block mb-1">Nivel</small>
                  <div><i class="bi bi-bar-chart-fill me-2" style="color: #28a745;"></i><strong style="font-size: 0.9rem;">${course.nivel || 'N/A'}</strong></div>
                </div>
                <div class="col-md-6">
                  <small class="text-muted d-block mb-1">Créditos</small>
                  <div><i class="bi bi-award-fill me-2" style="color: #ffc107;"></i><strong style="font-size: 0.9rem;">${course.creditos || 'N/A'}</strong></div>
                </div>
                <div class="col-md-6">
                  <small class="text-muted d-block mb-1">Periodo</small>
                  <div><i class="bi bi-calendar3 me-2" style="color: #17a2b8;"></i><strong style="font-size: 0.9rem;">${section.periodo || 'N/A'}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Columna Lateral -->
        <div class="col-lg-4">
          <!-- Profesor -->
          <div class="card shadow-sm mb-3" style="border: none;">
            <div class="card-body p-3">
              <h6 class="mb-3" style="color: #2c3e50;"><i class="bi bi-person-circle me-2" style="color: #4a90e2;"></i>Profesor</h6>
              ${teacher ? `
                <div class="text-center mb-2">
                  <div class="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                    <i class="bi bi-person-fill text-white" style="font-size: 1.5rem;"></i>
                  </div>
                </div>
                <h6 class="text-center mb-2" style="font-size: 0.9rem;">${teacher.primer_nombre} ${teacher.segundo_nombre || ''} ${teacher.apellido_paterno} ${teacher.apellido_materno || ''}</h6>
                ${teacher.email ? `<div class="d-flex align-items-center mb-1"><i class="bi bi-envelope me-2" style="color: #666; font-size: 0.85rem;"></i><small><a href="mailto:${teacher.email}" class="text-decoration-none" style="font-size: 0.8rem;">${teacher.email}</a></small></div>` : ''}
                ${teacher.telefono ? `<div class="d-flex align-items-center"><i class="bi bi-telephone me-2" style="color: #666; font-size: 0.85rem;"></i><small style="font-size: 0.8rem;">${teacher.telefono}</small></div>` : ''}
              ` : '<p class="text-muted text-center small mb-0">Sin profesor asignado</p>'}
            </div>
          </div>

          <!-- Horarios -->
          <div class="card shadow-sm" style="border: none;">
            <div class="card-body p-3">
              <h6 class="mb-3" style="color: #2c3e50;"><i class="bi bi-clock-fill me-2" style="color: #4a90e2;"></i>Horarios</h6>
              ${scheduleHTML}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * TAB: Anuncios
 */
async function renderAnnouncementsTab(container) {
  const { data: announcements, error } = await supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!announcements_created_by_fkey (
        primer_nombre,
        apellido_paterno
      )
    `)
    .eq('section_id', currentSection.id)
    .order('is_pinned', { ascending: false })
    .order('posted_at', { ascending: false })

  if (error) {
    container.innerHTML = '<div class="alert alert-danger">Error al cargar anuncios</div>'
    return
  }

  const announcementsList = announcements.length > 0 
    ? announcements.map(ann => {
        const author = ann.author
        const authorName = author ? `${author.primer_nombre} ${author.apellido_paterno}` : 'Desconocido'
        const postedDate = new Date(ann.posted_at).toLocaleDateString('es-ES', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })
        
        return `
          <div class="card mb-3 shadow-sm ${ann.is_pinned ? 'border-primary' : ''}" style="border-width: ${ann.is_pinned ? '2px' : '1px'};">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  ${ann.is_pinned ? '<span class="badge bg-primary me-2"><i class="bi bi-pin-fill"></i> Fijado</span>' : ''}
                  <h5 class="mb-1">${ann.title}</h5>
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" onclick="window.courseDetailView.editAnnouncement('${ann.id}')">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-danger" onclick="window.courseDetailView.deleteAnnouncement('${ann.id}')">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <p class="mb-2" style="white-space: pre-wrap;">${ann.content}</p>
              <small class="text-muted">
                <i class="bi bi-person me-1"></i>${authorName} • 
                <i class="bi bi-calendar3 me-1"></i>${postedDate}
              </small>
            </div>
          </div>
        `
      }).join('')
    : '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay anuncios publicados</div>'

  container.innerHTML = `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="bi bi-megaphone-fill me-2" style="color: #4a90e2;"></i>Anuncios</h4>
        <button class="btn btn-primary" onclick="window.courseDetailView.newAnnouncement()">
          <i class="bi bi-plus-lg me-1"></i>Nuevo Anuncio
        </button>
      </div>
      ${announcementsList}
    </div>
  `
}

/**
 * TAB: Módulos
 */
async function renderModulesTab(container) {
  const { data: modules, error } = await supabase
    .from('course_modules')
    .select(`
      *,
      items:course_module_items(*)
    `)
    .eq('section_id', currentSection.id)
    .eq('is_published', true)
    .order('order_index', { ascending: true })

  if (error) {
    container.innerHTML = '<div class="alert alert-danger">Error al cargar módulos</div>'
    return
  }

  const modulesList = modules.length > 0
    ? modules.map((module, idx) => {
        const itemsList = module.items && module.items.length > 0
          ? module.items
              .sort((a, b) => a.order_index - b.order_index)
              .map(item => {
                const typeIcons = {
                  file: 'bi-file-earmark',
                  link: 'bi-link-45deg',
                  assignment: 'bi-clipboard-check',
                  page: 'bi-file-text',
                  quiz: 'bi-question-circle',
                  discussion: 'bi-chat-dots'
                }
                const icon = typeIcons[item.item_type] || 'bi-circle'
                
                return `
                  <div class="d-flex align-items-center py-2 px-3 hover-bg-light" style="cursor: pointer;">
                    <i class="bi ${icon} me-3" style="color: #666;"></i>
                    <div class="flex-grow-1">
                      <div>${item.title}</div>
                      ${item.content ? `<small class="text-muted">${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}</small>` : ''}
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="window.courseDetailView.deleteModuleItem('${item.id}')">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                `
              }).join('')
          : '<div class="px-3 py-2 text-muted"><i class="bi bi-inbox me-2"></i>No hay contenido en este módulo</div>'

        return `
          <div class="card mb-3 shadow-sm">
            <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  <i class="bi bi-folder2-open me-2"></i>
                  Módulo ${idx + 1}: ${module.title}
                </h5>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-light btn-sm" onclick="window.courseDetailView.addModuleItem('${module.id}')">
                    <i class="bi bi-plus-lg me-1"></i>Agregar Contenido
                  </button>
                  <button class="btn btn-outline-light btn-sm" onclick="window.courseDetailView.editModule('${module.id}')">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-outline-light btn-sm" onclick="window.courseDetailView.deleteModule('${module.id}')">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              ${module.description ? `<p class="mb-0 mt-2 small" style="opacity: 0.9;">${module.description}</p>` : ''}
            </div>
            <div class="card-body p-0">
              ${itemsList}
            </div>
          </div>
        `
      }).join('')
    : '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay módulos creados. Crea el primer módulo para organizar el contenido del curso.</div>'

  container.innerHTML = `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="bi bi-collection-fill me-2" style="color: #667eea;"></i>Módulos del Curso</h4>
        <button class="btn btn-primary" onclick="window.courseDetailView.newModule()">
          <i class="bi bi-plus-lg me-1"></i>Nuevo Módulo
        </button>
      </div>
      ${modulesList}
    </div>
  `
}

/**
 * TAB: Tareas (Assignments)
 */
async function renderAssignmentsTab(container) {
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('section_id', currentSection.id)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error cargando tareas:', error)
  }

  const assignmentsList = assignments && assignments.length > 0
    ? assignments.map(a => {
        const typeIcons = {
          homework: 'file-text',
          exam: 'clipboard-check',
          quiz: 'question-circle',
          project: 'folder',
          lab: 'flask',
          participation: 'chat-dots'
        }
        const icon = typeIcons[a.assignment_type] || 'file-text'
        const dueDate = a.due_date ? new Date(a.due_date).toLocaleDateString('es-MX', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        }) : 'Sin fecha límite'
        
        return `
          <div class="card mb-2">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="mb-1">
                    <i class="bi bi-${icon} me-2 text-primary"></i>${a.title}
                  </h6>
                  <p class="mb-1 text-muted small">${a.description || ''}</p>
                  <div class="small">
                    <span class="badge bg-secondary me-2">${a.assignment_type}</span>
                    <span class="text-muted"><i class="bi bi-calendar me-1"></i>${dueDate}</span>
                    <span class="text-muted ms-2"><i class="bi bi-star me-1"></i>${a.max_points} pts</span>
                  </div>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-primary me-1">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
      }).join('')
    : '<div class="alert alert-info">No hay tareas creadas aún.</div>'

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><i class="bi bi-file-text me-2"></i>Tareas y Evaluaciones</h5>
        <button class="btn btn-primary btn-sm" onclick="window.courseDetailView.newAssignment()">
          <i class="bi bi-plus-lg me-1"></i>Nueva Tarea
        </button>
      </div>
      <div class="card-body">
        ${assignmentsList}
      </div>
    </div>
  `
}

/**
 * TAB: Calificaciones (Grades)
 */
async function renderGradesTab(container) {
  // Obtener todas las asignaciones
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('section_id', currentSection.id)
    .order('due_date', { ascending: true })

  // Obtener todos los estudiantes inscritos
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      *,
      student:profiles!enrollments_student_id_fkey (
        id,
        primer_nombre,
        apellido_paterno
      ),
      grades(*)
    `)
    .eq('section_id', currentSection.id)
    .eq('status', 'enrolled')
    .order('student(apellido_paterno)', { ascending: true })

  if (!assignments || !enrollments) {
    container.innerHTML = '<div class="alert alert-danger">Error al cargar datos</div>'
    return
  }

  // Construir tabla de calificaciones
  const gradeRows = enrollments.map(enr => {
    const student = enr.student
    const studentName = student ? `${student.primer_nombre} ${student.apellido_paterno}` : 'Desconocido'
    
    // Calcular promedio
    const grades = enr.grades || []
    const gradesByAssignment = {}
    grades.forEach(g => {
      gradesByAssignment[g.assignment_id] = g
    })
    
    const assignmentCells = assignments.map(assignment => {
      const grade = gradesByAssignment[assignment.id]
      const percentage = grade ? grade.percentage?.toFixed(1) : '-'
      const bgColor = grade 
        ? (grade.percentage >= 90 ? 'success' : grade.percentage >= 70 ? 'warning' : grade.percentage >= 60 ? 'info' : 'danger')
        : 'secondary'
      
      return `
        <td class="text-center" onclick="window.courseDetailView.editGrade('${enr.id}', '${assignment.id}')" style="cursor: pointer;">
          <span class="badge bg-${bgColor}">${percentage}%</span>
        </td>
      `
    }).join('')
    
    const allGrades = grades.map(g => g.percentage).filter(p => p != null)
    const average = allGrades.length > 0 
      ? (allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(1)
      : '-'
    
    return `
      <tr>
        <td><strong>${studentName}</strong></td>
        ${assignmentCells}
        <td class="text-center"><strong>${average}%</strong></td>
      </tr>
    `
  }).join('')

  const assignmentHeaders = assignments.map(a => `
    <th class="text-center" style="min-width: 100px;">
      <div>${a.title}</div>
      <small class="text-muted">(${a.max_points} pts)</small>
    </th>
  `).join('')

  container.innerHTML = `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="bi bi-bar-chart-fill me-2" style="color: #28a745;"></i>Libro de Calificaciones</h4>
        <button class="btn btn-success" onclick="window.courseDetailView.exportGrades()">
          <i class="bi bi-download me-1"></i>Exportar
        </button>
      </div>
      
      ${assignments.length === 0 ? 
        '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay asignaciones creadas. Ve a la pestaña de Tareas para crear una.</div>' :
        enrollments.length === 0 ?
        '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos en este curso.</div>' :
        `
        <div class="table-responsive">
          <table class="table table-bordered table-hover">
            <thead class="table-light">
              <tr>
                <th>Estudiante</th>
                ${assignmentHeaders}
                <th class="text-center">Promedio</th>
              </tr>
            </thead>
            <tbody>
              ${gradeRows}
            </tbody>
          </table>
        </div>
        <small class="text-muted mt-2 d-block">
          <i class="bi bi-info-circle me-1"></i>
          Haz click en cualquier celda para ingresar o editar una calificación
        </small>
        `
      }
    </div>
  `
}

/**
 * TAB: Asistencia (Attendance)
 */
async function renderAttendanceTab(container) {
  // Fecha seleccionada (por defecto hoy)
  const selectedDate = window.attendanceSelectedDate || new Date().toISOString().split('T')[0]
  
  // Obtener estudiantes inscritos
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      student:profiles!enrollments_student_id_fkey (
        id,
        primer_nombre,
        apellido_paterno
      )
    `)
    .eq('section_id', currentSection.id)
    .eq('status', 'enrolled')

  // Obtener asistencia para la fecha seleccionada
  const { data: attendance } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('attendance_date', selectedDate)
    .in('enrollment_id', enrollments?.map(e => e.id) || [])

  if (!enrollments) {
    container.innerHTML = '<div class="alert alert-danger">Error al cargar estudiantes</div>'
    return
  }

  // Crear mapa de asistencia
  const attendanceMap = {}
  attendance?.forEach(a => {
    attendanceMap[a.enrollment_id] = a
  })

  const attendanceRows = enrollments.map(enr => {
    const student = enr.student
    const studentName = student ? `${student.primer_nombre} ${student.apellido_paterno}` : 'Desconocido'
    const att = attendanceMap[enr.id]
    const status = att?.status || 'not_taken'
    
    const statusOptions = [
      { value: 'present', label: 'Presente', color: 'success', icon: 'check-circle-fill' },
      { value: 'absent', label: 'Ausente', color: 'danger', icon: 'x-circle-fill' },
      { value: 'late', label: 'Tardanza', color: 'warning', icon: 'clock-fill' },
      { value: 'excused', label: 'Justificado', color: 'info', icon: 'shield-check' }
    ]
    
    const buttons = statusOptions.map(opt => `
      <button class="btn btn-sm ${status === opt.value ? `btn-${opt.color}` : 'btn-outline-secondary'}" 
              onclick="window.courseDetailView.markAttendance('${enr.id}', '${opt.value}', '${selectedDate}')">
        <i class="bi bi-${opt.icon} me-1"></i>${opt.label}
      </button>
    `).join('')
    
    return `
      <tr>
        <td><strong>${studentName}</strong></td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            ${buttons}
          </div>
        </td>
        <td>
          <small class="text-muted">${att?.notes || ''}</small>
        </td>
      </tr>
    `
  }).join('')

  // Calcular estadísticas
  const stats = {
    present: attendance?.filter(a => a.status === 'present').length || 0,
    absent: attendance?.filter(a => a.status === 'absent').length || 0,
    late: attendance?.filter(a => a.status === 'late').length || 0,
    excused: attendance?.filter(a => a.status === 'excused').length || 0
  }
  const total = enrollments.length
  const taken = attendance?.length || 0

  container.innerHTML = `
    <div class="p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4><i class="bi bi-check2-square me-2" style="color: #4a90e2;"></i>Asistencia</h4>
        <div class="d-flex gap-2 align-items-center">
          <input type="date" class="form-control" id="attendanceDate" value="${selectedDate}" 
                 onchange="window.courseDetailView.changeAttendanceDate(this.value)">
          <button class="btn btn-success" onclick="window.courseDetailView.saveAllAttendance()">
            <i class="bi bi-save me-1"></i>Guardar Todo
          </button>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card border-success">
            <div class="card-body text-center">
              <h2 class="text-success mb-0">${stats.present}</h2>
              <small class="text-muted">Presentes</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-danger">
            <div class="card-body text-center">
              <h2 class="text-danger mb-0">${stats.absent}</h2>
              <small class="text-muted">Ausentes</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-warning">
            <div class="card-body text-center">
              <h2 class="text-warning mb-0">${stats.late}</h2>
              <small class="text-muted">Tardanzas</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-info">
            <div class="card-body text-center">
              <h2 class="text-info mb-0">${stats.excused}</h2>
              <small class="text-muted">Justificados</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de estudiantes -->
      ${enrollments.length === 0 ? 
        '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos en este curso.</div>' :
        `
        <div class="card shadow-sm">
          <div class="card-header bg-light">
            <h6 class="mb-0">Lista de Estudiantes (${taken}/${total} registrados)</h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th style="width: 200px;">Estudiante</th>
                    <th>Estado de Asistencia</th>
                    <th style="width: 200px;">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  ${attendanceRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        `
      }
    </div>
  `
}

/**
 * TAB: Estudiantes
 */
async function renderStudentsTab(container) {
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      enrollment_date,
      status,
      final_grade,
      student:profiles!enrollments_student_id_fkey (
        id,
        primer_nombre,
        segundo_nombre,
        apellido_paterno,
        apellido_materno,
        matricula,
        email,
        telefono
      )
    `)
    .eq('section_id', currentSection.id)
    .order('student(apellido_paterno)', { ascending: true })

  if (error) {
    console.error('Error cargando estudiantes:', error)
  }

  const enrolledStudents = enrollments?.filter(e => e.status === 'enrolled') || []
  const studentsList = enrolledStudents.length > 0
    ? enrolledStudents.map((e, index) => {
        const student = e.student
        const fullName = `${student.apellido_paterno} ${student.apellido_materno || ''} ${student.primer_nombre} ${student.segundo_nombre || ''}`.trim()
        
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${student.matricula || 'N/A'}</td>
            <td>${fullName}</td>
            <td>${student.email || 'N/A'}</td>
            <td>${student.telefono || 'N/A'}</td>
            <td>
              <span class="badge bg-success">Inscrito</span>
            </td>
          </tr>
        `
      }).join('')
    : '<tr><td colspan="6" class="text-center text-muted">No hay estudiantes inscritos</td></tr>'

  container.innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="bi bi-people me-2"></i>
          Estudiantes Inscritos (${enrolledStudents.length})
        </h5>
        <button class="btn btn-primary btn-sm">
          <i class="bi bi-download me-1"></i>Exportar Lista
        </button>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th width="50">#</th>
                <th>Matrícula</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${studentsList}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

/**
 * Funciones públicas expuestas globalmente
 */
window.courseDetailView = {
  goBack: () => {
    window.location.hash = '#/courses'
  },
  
  // ============ TAREAS ============
  newAssignment: async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nueva Tarea',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Título de la tarea">
        <textarea id="swal-description" class="swal2-textarea" placeholder="Descripción"></textarea>
        <select id="swal-type" class="swal2-select">
          <option value="homework">Tarea</option>
          <option value="exam">Examen</option>
          <option value="quiz">Quiz</option>
          <option value="project">Proyecto</option>
          <option value="lab">Laboratorio</option>
        </select>
        <input id="swal-points" type="number" class="swal2-input" placeholder="Puntos máximos" value="100">
        <input id="swal-due" type="datetime-local" class="swal2-input">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          description: document.getElementById('swal-description').value,
          assignment_type: document.getElementById('swal-type').value,
          max_points: document.getElementById('swal-points').value,
          due_date: document.getElementById('swal-due').value
        }
      }
    })

    if (formValues && formValues.title) {
      const { data: user } = await supabase.auth.getUser()
      const { error } = await supabase.from('assignments').insert({
        section_id: currentSection.id,
        title: formValues.title,
        description: formValues.description,
        assignment_type: formValues.assignment_type,
        max_points: formValues.max_points,
        due_date: formValues.due_date || null,
        created_by: user.user.id
      })

      if (error) {
        Swal.fire('Error', 'No se pudo crear la tarea', 'error')
      } else {
        Swal.fire('¡Éxito!', 'Tarea creada correctamente', 'success')
        showTab('assignments')
      }
    }
  },

  // ============ ANUNCIOS ============
  newAnnouncement: async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Anuncio',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Título del anuncio">
        <textarea id="swal-content" class="swal2-textarea" placeholder="Contenido del anuncio" rows="5"></textarea>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="swal-pinned">
          <label class="form-check-label" for="swal-pinned">
            Fijar este anuncio
          </label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Publicar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          content: document.getElementById('swal-content').value,
          is_pinned: document.getElementById('swal-pinned').checked
        }
      }
    })

    if (formValues && formValues.title) {
      const { data: user } = await supabase.auth.getUser()
      const { error } = await supabase.from('announcements').insert({
        section_id: currentSection.id,
        title: formValues.title,
        content: formValues.content,
        is_pinned: formValues.is_pinned,
        created_by: user.user.id
      })

      if (error) {
        Swal.fire('Error', 'No se pudo crear el anuncio', 'error')
      } else {
        Swal.fire('¡Éxito!', 'Anuncio publicado correctamente', 'success')
        showTab('announcements')
      }
    }
  },

  editAnnouncement: async (id) => {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single()

    if (!announcement) return

    const { value: formValues } = await Swal.fire({
      title: 'Editar Anuncio',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Título" value="${announcement.title}">
        <textarea id="swal-content" class="swal2-textarea" placeholder="Contenido" rows="5">${announcement.content}</textarea>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="swal-pinned" ${announcement.is_pinned ? 'checked' : ''}>
          <label class="form-check-label" for="swal-pinned">Fijar este anuncio</label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          content: document.getElementById('swal-content').value,
          is_pinned: document.getElementById('swal-pinned').checked
        }
      }
    })

    if (formValues) {
      const { error } = await supabase
        .from('announcements')
        .update(formValues)
        .eq('id', id)

      if (error) {
        Swal.fire('Error', 'No se pudo actualizar el anuncio', 'error')
      } else {
        Swal.fire('¡Éxito!', 'Anuncio actualizado', 'success')
        showTab('announcements')
      }
    }
  },

  deleteAnnouncement: async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar anuncio?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) {
        Swal.fire('Error', 'No se pudo eliminar el anuncio', 'error')
      } else {
        Swal.fire('¡Eliminado!', 'El anuncio ha sido eliminado', 'success')
        showTab('announcements')
      }
    }
  },

  // ============ MÓDULOS ============
  newModule: async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Módulo',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Título del módulo">
        <textarea id="swal-description" class="swal2-textarea" placeholder="Descripción (opcional)"></textarea>
        <input id="swal-order" type="number" class="swal2-input" placeholder="Orden" value="0">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          description: document.getElementById('swal-description').value,
          order_index: parseInt(document.getElementById('swal-order').value)
        }
      }
    })

    if (formValues && formValues.title) {
      const { data: user } = await supabase.auth.getUser()
      const { error } = await supabase.from('course_modules').insert({
        section_id: currentSection.id,
        title: formValues.title,
        description: formValues.description,
        order_index: formValues.order_index,
        created_by: user.user.id
      })

      if (error) {
        Swal.fire('Error', 'No se pudo crear el módulo', 'error')
      } else {
        Swal.fire('¡Éxito!', 'Módulo creado correctamente', 'success')
        showTab('modules')
      }
    }
  },

  editModule: async (id) => {
    const { data: module } = await supabase
      .from('course_modules')
      .select('*')
      .eq('id', id)
      .single()

    if (!module) return

    const { value: formValues } = await Swal.fire({
      title: 'Editar Módulo',
      html: `
        <input id="swal-title" class="swal2-input" value="${module.title}">
        <textarea id="swal-description" class="swal2-textarea">${module.description || ''}</textarea>
        <input id="swal-order" type="number" class="swal2-input" value="${module.order_index}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          description: document.getElementById('swal-description').value,
          order_index: parseInt(document.getElementById('swal-order').value)
        }
      }
    })

    if (formValues) {
      const { error } = await supabase
        .from('course_modules')
        .update(formValues)
        .eq('id', id)

      if (error) {
        Swal.fire('Error', 'No se pudo actualizar', 'error')
      } else {
        Swal.fire('¡Éxito!', 'Módulo actualizado', 'success')
        showTab('modules')
      }
    }
  },

  deleteModule: async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar módulo?',
      text: 'Se eliminarán todos los contenidos del módulo',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    })

    if (result.isConfirmed) {
      const { error } = await supabase.from('course_modules').delete().eq('id', id)
      if (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error')
      } else {
        Swal.fire('¡Eliminado!', 'Módulo eliminado', 'success')
        showTab('modules')
      }
    }
  },

  addModuleItem: async (moduleId) => {
    const { value: formValues } = await Swal.fire({
      title: 'Agregar Contenido',
      html: `
        <input id="swal-title" class="swal2-input" placeholder="Título">
        <select id="swal-type" class="swal2-select">
          <option value="page">Página</option>
          <option value="file">Archivo</option>
          <option value="link">Enlace</option>
          <option value="assignment">Tarea</option>
          <option value="quiz">Quiz</option>
        </select>
        <textarea id="swal-content" class="swal2-textarea" placeholder="Contenido o descripción"></textarea>
        <input id="swal-url" class="swal2-input" placeholder="URL (opcional)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return {
          title: document.getElementById('swal-title').value,
          item_type: document.getElementById('swal-type').value,
          content: document.getElementById('swal-content').value,
          url: document.getElementById('swal-url').value
        }
      }
    })

    if (formValues && formValues.title) {
      const { data: user } = await supabase.auth.getUser()
      const { error } = await supabase.from('course_module_items').insert({
        module_id: moduleId,
        title: formValues.title,
        item_type: formValues.item_type,
        content: formValues.content,
        url: formValues.url,
        created_by: user.user.id
      })

      if (error) {
        Swal.fire('Error', 'No se pudo agregar el contenido', 'error')
      } else {
        Swal.fire('¡Éxito!', 'Contenido agregado', 'success')
        showTab('modules')
      }
    }
  },

  deleteModuleItem: async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar contenido?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    })

    if (result.isConfirmed) {
      const { error } = await supabase.from('course_module_items').delete().eq('id', id)
      if (!error) {
        Swal.fire('¡Eliminado!', '', 'success')
        showTab('modules')
      }
    }
  },

  // ============ CALIFICACIONES ============
  editGrade: async (enrollmentId, assignmentId) => {
    // Obtener calificación existente
    const { data: existingGrade } = await supabase
      .from('grades')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('assignment_id', assignmentId)
      .single()

    // Obtener info de la tarea
    const { data: assignment } = await supabase
      .from('assignments')
      .select('title, max_points')
      .eq('id', assignmentId)
      .single()

    const currentScore = existingGrade?.score || ''
    const maxScore = assignment?.max_points || 100

    const { value: score } = await Swal.fire({
      title: `Calificación: ${assignment?.title}`,
      html: `
        <input id="swal-score" type="number" class="swal2-input" 
               placeholder="Puntos obtenidos" value="${currentScore}" 
               min="0" max="${maxScore}" step="0.01">
        <small class="text-muted">Máximo: ${maxScore} puntos</small>
        <textarea id="swal-feedback" class="swal2-textarea" 
                  placeholder="Retroalimentación (opcional)">${existingGrade?.feedback || ''}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        return {
          score: parseFloat(document.getElementById('swal-score').value),
          feedback: document.getElementById('swal-feedback').value
        }
      }
    })

    if (score && !isNaN(score.score)) {
      const { data: user } = await supabase.auth.getUser()
      
      if (existingGrade) {
        // Actualizar
        const { error } = await supabase
          .from('grades')
          .update({
            score: score.score,
            max_score: maxScore,
            feedback: score.feedback,
            graded_by: user.user.id
          })
          .eq('id', existingGrade.id)

        if (!error) {
          Swal.fire('¡Éxito!', 'Calificación actualizada', 'success')
          showTab('grades')
        }
      } else {
        // Insertar nueva
        const { error } = await supabase.from('grades').insert({
          enrollment_id: enrollmentId,
          assignment_id: assignmentId,
          score: score.score,
          max_score: maxScore,
          feedback: score.feedback,
          graded_by: user.user.id
        })

        if (!error) {
          Swal.fire('¡Éxito!', 'Calificación guardada', 'success')
          showTab('grades')
        }
      }
    }
  },

  exportGrades: () => {
    Swal.fire('Exportar', 'Función de exportación en desarrollo', 'info')
  },

  // ============ ASISTENCIA ============
  changeAttendanceDate: (date) => {
    window.attendanceSelectedDate = date
    showTab('attendance')
  },

  markAttendance: async (enrollmentId, status, date) => {
    const { data: user } = await supabase.auth.getUser()
    
    // Verificar si ya existe registro
    const { data: existing } = await supabase
      .from('student_attendance')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .eq('attendance_date', date)
      .single()

    if (existing) {
      // Actualizar
      await supabase
        .from('student_attendance')
        .update({ status })
        .eq('id', existing.id)
    } else {
      // Insertar
      await supabase.from('student_attendance').insert({
        enrollment_id: enrollmentId,
        attendance_date: date,
        status,
        recorded_by: user.user.id
      })
    }

    showTab('attendance')
  },

  saveAllAttendance: () => {
    Swal.fire('Guardado', 'Asistencia guardada automáticamente', 'success')
  }
}
