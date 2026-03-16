import { supabase } from '../../lib/supabaseClient.js'

export function getStudentPortalModules() {
  return [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: 'bi-house-heart-fill',
      description: 'Resumen de rendimiento'
    },
    {
      id: 'inscriptions',
      label: 'Inscripciones',
      icon: 'bi-clipboard-check',
      description: 'Buscar y inscribirse a cursos abiertos'
    },
    {
      id: 'my-courses',
      label: 'Mis Cursos',
      icon: 'bi-backpack4-fill',
      description: 'Materias inscritas'
    },
    {
      id: 'my-progress',
      label: 'Mi Progreso',
      icon: 'bi-graph-up-arrow',
      description: 'Avance académico'
    }
  ]
}

export async function renderStudentPortalView(container, moduleId, user) {
  switch (moduleId) {
    case 'dashboard':
      await renderStudentHome(container, user)
      break
    case 'inscriptions':
      await renderAvailableCourses(container, user)
      break
    case 'my-courses':
      await renderMyCourses(container, user)
      break
    case 'my-progress':
      await renderMyProgress(container, user)
      break
    default:
      container.innerHTML = '<div class="alert alert-warning">Módulo no disponible para estudiantes.</div>'
  }
}

/**
 * Renderiza cursos disponibles para inscripción
 */
async function renderAvailableCourses(container, user) {
  try {
    // Usar profile_id directamente para el enrollment
    const profileId = user.id

    // 2. Obtener enrollments actuales del estudiante
    const { data: currentEnrollments } = await supabase
      .from('enrollments')
      .select('section_id')
      .eq('student_id', profileId)
      .eq('status', 'enrolled')

    const enrolledSectionIds = (currentEnrollments || []).map(e => e.section_id)

    // 3. Obtener cursos y secciones activas
    const { data: sections, error: sectionsError } = await supabase
      .from('course_sections')
      .select(`
        id,
        nombre,
        periodo,
        cupo_maximo,
        aula,
        course_id,
        teacher_id,
        courses (
          id,
          nombre,
          codigo,
          descripcion,
          creditos
        ),
        profiles (
          nombre,
          apellido
        )
      `)
      .eq('activo', true)
      .order('courses(nombre)', { ascending: true })

    if (sectionsError) {
      container.innerHTML = `<div class="alert alert-danger">Error: ${sectionsError.message}</div>`
      return
    }

    if (!sections || sections.length === 0) {
      container.innerHTML = `
        <section class="portal-card empty-state">
          <i class="bi bi-journal-x"></i>
          <h4>No hay cursos disponibles</h4>
          <p>Por el momento, no hay cursos abiertos para inscripción.</p>
        </section>
      `
      return
    }

    // 4. Contar cupos disponibles por sección
    const sectionsWithQuota = await Promise.all(
      sections.map(async (section) => {
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('section_id', section.id)
          .eq('status', 'enrolled')

        const enrolledCount = count || 0
        const availableQuota = Math.max(0, section.cupo_maximo - enrolledCount)
        const isEnrolled = enrolledSectionIds.includes(section.id)

        return {
          ...section,
          enrolledCount,
          availableQuota,
          isEnrolled
        }
      })
    )

    // 5. Renderizar
    const courseCards = sectionsWithQuota.map(section => {
      const course = section.courses
      const teacher = section.profiles
      const teacherName = teacher ? 
        `${teacher.nombre || ''} ${teacher.apellido || ''}`.trim() : 
        'Sin asignar'
      const quotaPercent = Math.round((section.enrolledCount / section.cupo_maximo) * 100)
      const quotaClass = section.availableQuota === 0 ? 'danger' : 
                        section.availableQuota <= 5 ? 'warning' : 'success'

      return `
        <article class="portal-course-card" data-section-id="${section.id}">
          <div class="course-header">
            <div>
              <h5 class="course-title">${course?.nombre || 'Sin nombre'}</h5>
              <p class="course-code">${course?.codigo || '-'} · ${section.nombre}</p>
              <p class="course-description">${course?.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
          
          <div class="course-meta-row">
            <span class="meta-item">
              <i class="bi bi-person-workspace"></i>
              <span>${teacherName}</span>
            </span>
            <span class="meta-item">
              <i class="bi bi-calendar-event"></i>
              <span>${section.periodo || 'Periodo no especificado'}</span>
            </span>
            <span class="meta-item">
              <i class="bi bi-geo-alt"></i>
              <span>${section.aula || 'Aula no asignada'}</span>
            </span>
            <span class="meta-item">
              <i class="bi bi-award"></i>
              <span>${course?.creditos || 0} créditos</span>
            </span>
          </div>

          <div class="course-quota">
            <div class="quota-bar">
              <div class="quota-filled" style="width: ${quotaPercent}%"></div>
            </div>
            <p class="quota-text text-${quotaClass}">
              <strong>${section.availableQuota}</strong> cupos disponibles 
              (<strong>${section.enrolledCount}/${section.cupo_maximo}</strong> inscritos)
            </p>
          </div>

          <div class="course-actions">
            ${section.isEnrolled ? 
              `<span class="badge badge-success"><i class="bi bi-check-circle"></i> Ya estás inscrito</span>` :
              section.availableQuota > 0 ?
              `<button class="btn btn-primary btn-enroll" data-section-id="${section.id}" data-profile-id="${profileId}">
                <i class="bi bi-plus-circle"></i> Inscribirse
              </button>` :
              `<span class="badge badge-secondary"><i class="bi bi-x-circle"></i> Sin cupos disponibles</span>`
            }
          </div>
        </article>
      `
    }).join('')

    container.innerHTML = `
      <section class="portal-card">
        <div class="portal-card-header-inline">
          <h4>Cursos Disponibles para Inscripción</h4>
          <span class="portal-badge">${sections.length} cursos</span>
        </div>
        <div class="courses-grid">
          ${courseCards}
        </div>
      </section>
      <style>
        .courses-grid {
          display: grid;
          gap: 16px;
        }
        .portal-course-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          background: #fafafa;
          transition: all 0.3s ease;
        }
        .portal-course-card:hover {
          border-color: #1e3a5f;
          background: white;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .course-header {
          margin-bottom: 12px;
        }
        .course-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #1e3a5f;
        }
        .course-code {
          font-size: 0.85rem;
          color: #666;
          margin: 0 0 8px 0;
        }
        .course-description {
          font-size: 0.9rem;
          color: #555;
          margin: 0;
          line-height: 1.4;
        }
        .course-meta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 12px 0;
          padding: 12px 0;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #555;
        }
        .meta-item i {
          color: #1e3a5f;
        }
        .course-quota {
          margin: 12px 0;
        }
        .quota-bar {
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .quota-filled {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #20c997);
          transition: width 0.3s ease;
        }
        .quota-text {
          font-size: 0.85rem;
          margin: 0;
        }
        .text-success { color: #28a745; }
        .text-warning { color: #ffc107; }
        .text-danger { color: #dc3545; }
        .course-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        .btn-enroll {
          flex: 1;
          padding: 8px 12px;
          font-size: 0.9rem;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
        }
        .badge-success {
          background: #d4edda;
          color: #155724;
        }
        .badge-secondary {
          background: #e2e3e5;
          color: #383d41;
        }
      </style>
    `

    // Agregar event listeners para inscripción
    setTimeout(() => {
      container.querySelectorAll('.btn-enroll').forEach(btn => {
        btn.addEventListener('click', async () => {
          await handleEnrollClick(btn, profileId, user, container)
        })
      })
    }, 0)

  } catch (error) {
    console.error('Error renderizando cursos disponibles:', error)
    container.innerHTML = `
      <div class="alert alert-danger">
        Error al cargar cursos disponibles: ${error.message}
      </div>
    `
  }
}

/**
 * Maneja el click en el botón de inscripción
 */
async function handleEnrollClick(btn, profileId, user, container) {
  const sectionId = btn.dataset.sectionId
  
  btn.disabled = true
  const originalText = btn.innerHTML
  btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...'

  try {
    // Crear enrollment usando profile_id como student_id
    const { data, error } = await supabase
      .from('enrollments')
      .insert([
        {
          student_id: profileId,
          section_id: sectionId
        }
      ])

    if (error) throw error

    // Mostrar mensaje de éxito
    showEnrollmentNotification(true, 'Inscripción exitosa')
    
    // Actualizar la vista después de 1 segundo
    setTimeout(() => {
      renderAvailableCourses(container, user)
    }, 1000)

  } catch (error) {
    console.error('Error en inscripción:', error)
    showEnrollmentNotification(false, error.message || 'Error en la inscripción')
    btn.disabled = false
    btn.innerHTML = originalText
  }
}

/**
 * Notificación de inscripción
 */
function showEnrollmentNotification(success, message) {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    animation: slideInDown 0.3s ease-out;
  `

  const alertClass = success ? 'alert-success' : 'alert-danger'
  const icon = success ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'

  notification.innerHTML = `
    <style>
      @keyframes slideInDown {
        from { opacity: 0; top: -100px; }
        to { opacity: 1; top: 20px; }
      }
    </style>
    <div class="alert ${alertClass} shadow-lg border-0" style="min-width: 400px; margin: 0;">
      <i class="bi ${icon} me-2"></i> ${message}
    </div>
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'slideOutUp 0.3s ease-out'
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

async function renderStudentHome(container, user) {
  const studentName = buildDisplayName(user)

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('id, status, final_grade')
    .eq('student_id', user.id)

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando resumen de estudiante: ${error.message}</div>`
    return
  }

  const active = (enrollments || []).filter(item => item.status === 'enrolled')
  const completed = (enrollments || []).filter(item => item.status === 'completed')
  const graded = (enrollments || []).filter(item => typeof item.final_grade === 'number')
  const average = graded.length
    ? (graded.reduce((sum, item) => sum + item.final_grade, 0) / graded.length).toFixed(1)
    : 'N/A'

  container.innerHTML = `
    <section class="portal-hero portal-hero-student">
      <div>
        <h2>Portal Estudiantil</h2>
        <p>Hola ${studentName}, este es tu estado académico de hoy.</p>
      </div>
      <div class="portal-hero-chip">
        <i class="bi bi-stars"></i>
        <span>Objetivo semanal: consistencia</span>
      </div>
    </section>

    <section class="portal-grid portal-grid-3">
      <article class="portal-card metric">
        <small>Cursos activos</small>
        <h3>${active.length}</h3>
      </article>
      <article class="portal-card metric">
        <small>Cursos completados</small>
        <h3>${completed.length}</h3>
      </article>
      <article class="portal-card metric">
        <small>Promedio global</small>
        <h3>${average}</h3>
      </article>
    </section>

    <section class="portal-card">
      <h4>Acciones rápidas</h4>
      <div class="portal-shortcuts">
        <button class="portal-shortcut" data-student-view="inscriptions">
          <i class="bi bi-clipboard-check"></i>
          <span>Inscribirse a cursos</span>
        </button>
        <button class="portal-shortcut" data-student-view="my-courses">
          <i class="bi bi-backpack2"></i>
          <span>Ver mis cursos</span>
        </button>
        <button class="portal-shortcut" data-student-view="my-progress">
          <i class="bi bi-bar-chart-line"></i>
          <span>Revisar progreso</span>
        </button>
      </div>
    </section>
  `
}

async function renderMyCourses(container, user) {
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      final_grade,
      section:course_sections (
        id,
        nombre,
        periodo,
        modalidad,
        curso:courses (
          nombre,
          codigo
        ),
        profiles (
          nombre,
          apellido
        )
      )
    `)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando cursos del estudiante: ${error.message}</div>`
    return
  }

  if (!enrollments || enrollments.length === 0) {
    container.innerHTML = `
      <section class="portal-card empty-state">
        <i class="bi bi-journal-x"></i>
        <h4>Sin cursos inscritos</h4>
        <p>Todavía no tienes materias activas. Revisa con coordinación académica.</p>
      </section>
    `
    return
  }

  container.innerHTML = `
    <section class="portal-card">
      <div class="portal-card-header-inline">
        <h4>Mis Cursos</h4>
        <span class="portal-badge">${enrollments.length} registros</span>
      </div>
      <div class="portal-course-list">
        ${enrollments.map(renderStudentEnrollmentCard).join('')}
      </div>
    </section>
  `

  // Add event listeners to view details buttons
  container.querySelectorAll('.btn-view-student-course').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sectionId = e.currentTarget.dataset.sectionId
      const enrollmentId = e.currentTarget.dataset.enrollmentId
      showStudentCourseDetails(container, sectionId, enrollmentId, user)
    })
  })
}

async function renderMyProgress(container, user) {
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('id, status, final_grade')
    .eq('student_id', user.id)

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando progreso: ${error.message}</div>`
    return
  }

  const enrollmentIds = (enrollments || []).map(item => item.id)
  let attendance = []

  if (enrollmentIds.length > 0) {
    const { data } = await supabase
      .from('student_attendance')
      .select('status')
      .in('enrollment_id', enrollmentIds)

    attendance = data || []
  }

  const present = attendance.filter(item => item.status === 'present').length
  const totalAttendance = attendance.length
  const attendanceRate = totalAttendance > 0
    ? `${Math.round((present / totalAttendance) * 100)}%`
    : 'N/A'

  const graded = (enrollments || []).filter(item => typeof item.final_grade === 'number')
  const average = graded.length
    ? (graded.reduce((sum, item) => sum + item.final_grade, 0) / graded.length).toFixed(1)
    : 'N/A'

  container.innerHTML = `
    <section class="portal-grid portal-grid-2">
      <article class="portal-card metric metric-wide">
        <small>Promedio acumulado</small>
        <h3>${average}</h3>
        <p>Calculado con materias que ya tienen calificación final.</p>
      </article>
      <article class="portal-card metric metric-wide">
        <small>Asistencia general</small>
        <h3>${attendanceRate}</h3>
        <p>Basado en ${totalAttendance} registros de asistencia.</p>
      </article>
    </section>

    <section class="portal-card">
      <h4>Recomendación</h4>
      <p class="mb-0">Mantén tu asistencia por encima de 90% para conservar estabilidad académica durante el periodo.</p>
    </section>
  `
}

// Student Course Details View
async function showStudentCourseDetails(container, sectionId, enrollmentId, user) {
  const { data: section, error } = await supabase
    .from('course_sections')
    .select(`
      id,
      nombre,
      periodo,
      cupo_maximo,
      modalidad,
      aula,
      activo,
      teacher:profiles(primer_nombre, apellido_paterno, email),
      curso:courses (
        id,
        nombre,
        codigo,
        descripcion,
        creditos
      ),
      schedules (
        dia_semana,
        hora_inicio,
        hora_fin
      )
    `)
    .eq('id', sectionId)
    .single()

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando detalles del curso: ${error.message}</div>`
    return
  }

  const course = section.curso
  const teacher = section.teacher

  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', sectionId)
    .eq('status', 'enrolled')

  const schedules = section.schedules || []
  const teacherDisplayName = [teacher?.nombre, teacher?.apellido]
    .filter(Boolean)
    .join(' ') || 'Docente'

  const html = `
    <div class="course-detail-view">
      <!-- Header Compacto -->
      <div class="bg-white border-bottom shadow-sm">
        <div class="d-flex align-items-center justify-content-between px-4 py-2">
          <div class="d-flex align-items-center gap-3">
            <button class="btn btn-sm btn-outline-secondary" id="btn-back-student-courses">
              <i class="bi bi-arrow-left"></i>
            </button>
            <div>
              <h5 class="mb-0" style="font-weight: 600; color: #2c3e50;">${course?.nombre || 'Curso'}</h5>
              <small class="text-muted">${course?.codigo || '-'} • ${teacherDisplayName} • ${enrollmentCount || 0} estudiantes</small>
            </div>
          </div>
          <div>
            ${section.activo 
              ? '<span class="badge bg-success">Activo</span>'
              : '<span class="badge bg-secondary">Inactivo</span>'}
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="px-4">
          <ul class="nav nav-tabs border-0 course-nav-tabs">
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
          </ul>
        </div>
      </div>

      <!-- Contenido -->
      <div id="student-course-tab-content" style="background: #f8f9fa; min-height: 500px; padding: 20px;">
        <!-- El contenido se carga aquí -->
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
          text-decoration: none;
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
    </div>
  `

  container.innerHTML = html

  // Back button
  document.getElementById('btn-back-student-courses').addEventListener('click', async () => {
    await renderMyCourses(container, user)
  })

  // Tab navigation
  document.querySelectorAll('.course-nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const tab = e.currentTarget.dataset.tab
      
      document.querySelectorAll('.course-nav-item').forEach(l => {
        l.classList.remove('active')
      })
      e.currentTarget.classList.add('active')
      
      loadStudentTabContent(tab, sectionId, enrollmentId, user)
    })
  })

  // Load default tab
  await loadStudentTabContent('general', sectionId, enrollmentId, user)
}

// Load tab content for student view
async function loadStudentTabContent(tabName, sectionId, enrollmentId, user) {
  const contentDiv = document.getElementById('student-course-tab-content')
  
  switch(tabName) {
    case 'general':
      await loadStudentGeneralTab(contentDiv, sectionId)
      break
    case 'announcements':
      await loadStudentAnuncios(sectionId)
      break
    case 'modules':
      await loadStudentModulos(sectionId)
      break
    case 'assignments':
      await loadStudentTareas(sectionId, enrollmentId, user)
      break
    case 'grades':
      await loadStudentCalificaciones(enrollmentId)
      break
    case 'attendance':
      await loadStudentAsistencia(sectionId, user)
      break
  }
}

async function loadStudentGeneralTab(contentDiv, sectionId) {
  if (!contentDiv) return
  
  const { data: section } = await supabase
    .from('course_sections')
    .select(`
      *,
      curso:courses (nombre, codigo, descripcion, creditos),
      teacher:profiles(primer_nombre, apellido_paterno, email),
      schedules(dia_semana, hora_inicio, hora_fin)
    `)
    .eq('id', sectionId)
    .single()

  const course = section.curso
  const teacher = section.teacher
  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', sectionId)
    .eq('status', 'enrolled')

  const scheduleText = section.schedules?.length
    ? section.schedules.map(s => {
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
        return `${dias[s.dia_semana] || 'Día'} ${s.hora_inicio?.slice(0, 5) || '--:--'}-${s.hora_fin?.slice(0, 5) || '--:--'}`
      }).join(' | ')
    : 'Horario no definido'

  const html = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-3">${course?.nombre || 'Curso'}</h5>
              <p class="text-muted mb-3">${course?.descripcion || 'Sin descripción'}</p>
              
              <h6 class="mb-3">Información del Curso</h6>
              <div class="row">
                <div class="col-6 mb-3">
                  <small class="text-muted d-block">Código</small>
                  <strong>${course?.codigo || '-'}</strong>
                </div>
                <div class="col-6 mb-3">
                  <small class="text-muted d-block">Créditos</small>
                  <strong>${course?.creditos || 0}</strong>
                </div>
                <div class="col-6 mb-3">
                  <small class="text-muted d-block">Período</small>
                  <strong>${section.periodo || '-'}</strong>
                </div>
                <div class="col-6 mb-3">
                  <small class="text-muted d-block">Modalidad</small>
                  <strong>${section.modalidad || '-'}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="row">
            <div class="col-md-4 mb-4">
              <div class="card border-0 shadow-sm text-center">
                <div class="card-body">
                  <small class="text-muted d-block mb-2">Cupo Total</small>
                  <h4 class="mb-0">${section.cupo_maximo || 0}</h4>
                </div>
              </div>
            </div>
            <div class="col-md-4 mb-4">
              <div class="card border-0 shadow-sm text-center">
                <div class="card-body">
                  <small class="text-muted d-block mb-2">Inscritos</small>
                  <h4 class="mb-0">${enrollmentCount || 0}</h4>
                </div>
              </div>
            </div>
            <div class="col-md-4 mb-4">
              <div class="card border-0 shadow-sm text-center">
                <div class="card-body">
                  <small class="text-muted d-block mb-2">Disponibles</small>
                  <h4 class="mb-0 ${(section.cupo_maximo - (enrollmentCount || 0)) > 0 ? 'text-success' : 'text-danger'}">${Math.max(0, section.cupo_maximo - (enrollmentCount || 0))}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="col-lg-4">
          <!-- Profesor -->
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body text-center">
              <div class="mb-3">
                <div style="width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
                  <i class="bi bi-person"></i>
                </div>
              </div>
              <h6 class="mb-1">${teacher?.nombre || '-'} ${teacher?.apellido || ''}</h6>
              <small class="text-muted d-block">${teacher?.email || '-'}</small>
            </div>
          </div>

          <!-- Horarios -->
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="card-title mb-3">
                <i class="bi bi-clock me-2"></i>Horarios
              </h6>
              <div class="text-muted small">${scheduleText}</div>
              ${section.aula ? `<div class="mt-3 pt-3 border-top"><small class="text-muted">Aula:</small> <strong>${section.aula}</strong></div>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  contentDiv.innerHTML = html
}

async function loadStudentAnuncios(sectionId) {
  const container = document.getElementById('student-course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: anuncios, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('section_id', sectionId)
    .order('created_at', { ascending: false })

  if (error || !anuncios?.length) {
    container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay anuncios disponibles</div>'
    return
  }

  const html = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-8">
          ${anuncios.map(ann => `
            <div class="card border-0 shadow-sm mb-3">
              <div class="card-body">
                <h6 class="card-title">${ann.titulo || 'Sin título'}</h6>
                <p class="card-text text-muted mb-2">${ann.contenido || ''}</p>
                <small class="text-muted"><i class="bi bi-calendar"></i> ${new Date(ann.created_at).toLocaleDateString('es-ES')}</small>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
  container.innerHTML = html
}

async function loadStudentModulos(sectionId) {
  const container = document.getElementById('student-course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: modulos, error } = await supabase
    .from('study_resources')
    .select('*')
    .eq('section_id', sectionId)
    .eq('tipo', 'documento')
    .order('created_at', { ascending: true })

  if (error || !modulos?.length) {
    container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay módulos disponibles</div>'
    return
  }

  const html = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-8">
          ${modulos.map((mod, idx) => `
            <div class="card border-0 shadow-sm mb-3">
              <div class="card-body">
                <h6 class="card-title"><span class="badge bg-primary me-2">${idx + 1}</span>${mod.titulo || 'Sin título'}</h6>
                <p class="card-text text-muted mb-2">${mod.descripcion || ''}</p>
                ${mod.archivo_url ? `<p class="mb-2"><a href="${mod.archivo_url}" target="_blank" class="btn btn-sm btn-outline-secondary"><i class="bi bi-download"></i> Descargar archivo</a></p>` : ''}
                <small class="text-muted"><i class="bi bi-calendar"></i> ${new Date(mod.created_at).toLocaleDateString('es-ES')}</small>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `
  container.innerHTML = html
}

async function loadStudentTareas(sectionId, enrollmentId, user) {
  const container = document.getElementById('student-course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: tareas, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('section_id', sectionId)
    .order('fecha_limite', { ascending: true })

  if (error || !tareas?.length) {
    container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay tareas disponibles</div>'
    return
  }

  const html = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-10">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Fecha Entrega</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                ${tareas.map(tarea => `
                  <tr>
                    <td><strong>${tarea.titulo || '-'}</strong></td>
                    <td>${tarea.descripcion?.substring(0, 50) || '-'}${tarea.descripcion?.length > 50 ? '...' : ''}</td>
                    <td><small>${tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleDateString('es-ES') : '-'}</small></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary btn-submit-task" data-task-id="${tarea.id}" data-enrollment-id="${enrollmentId}">
                        <i class="bi bi-upload"></i> Enviar Trabajo
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
  container.innerHTML = html

  document.querySelectorAll('.btn-submit-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      alert('Funcionalidad de envío de trabajos - será implementada con módulo de archivos')
    })
  })
}

async function loadStudentCalificaciones(enrollmentId) {
  const container = document.getElementById('student-course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single()

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando calificación: ${error.message}</div>`
    return
  }

  const calif = enrollment?.calificacion_final
  const statusBadge = !calif 
    ? '<span class="badge bg-warning">Pendiente</span>'
    : calif >= 3.0 
    ? '<span class="badge bg-success">Aprobado</span>'
    : '<span class="badge bg-danger">No aprobado</span>'

  const html = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-4">Mi Calificación</h5>
              
              <div class="row mb-4">
                <div class="col-md-6">
                  <div class="card bg-light border-0">
                    <div class="card-body text-center">
                      <small class="text-muted d-block mb-2">Calificación Final</small>
                      <h3 class="mb-2">${calif !== null ? calif.toFixed(1) : '-'}</h3>
                      <div>${statusBadge}</div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card bg-light border-0">
                    <div class="card-body">
                      <small class="text-muted d-block mb-2">Comentarios del Docente</small>
                      <p class="mb-0">${enrollment?.comentarios || '<em class="text-muted">Sin comentarios aún</em>'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  container.innerHTML = html
}

async function loadStudentAsistencia(sectionId, user) {
  const container = document.getElementById('student-course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('section_id', sectionId)
    .eq('student_id', user.id)
    .order('fecha', { ascending: false })
    .limit(50)

  if (error || !attendance?.length) {
    container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay registros de asistencia</div>'
    return
  }

  const asistencias = attendance.filter(a => a.estado === 'presente').length
  const faltas = attendance.filter(a => a.estado === 'ausente').length
  const justificadas = attendance.filter(a => a.estado === 'justificado').length
  const porcentaje = Math.round((asistencias / attendance.length) * 100)

  const html = `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <div class="card text-center border-0 shadow-sm">
            <div class="card-body">
              <small class="text-muted">Asistencias</small>
              <h4 class="text-success">${asistencias}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card text-center border-0 shadow-sm">
            <div class="card-body">
              <small class="text-muted">Faltas</small>
              <h4 class="text-danger">${faltas}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card text-center border-0 shadow-sm">
            <div class="card-body">
              <small class="text-muted">Justificadas</small>
              <h4 class="text-warning">${justificadas}</h4>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card text-center border-0 shadow-sm">
            <div class="card-body">
              <small class="text-muted">% Asistencia</small>
              <h4 class="text-info">${porcentaje}%</h4>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-lg-10">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${attendance.map(att => {
                  const statusBadge = att.estado === 'asistente'
                    ? '<span class="badge bg-success">Asistente</span>'
                    : att.estado === 'falta'
                    ? '<span class="badge bg-danger">Falta</span>'
                    : '<span class="badge bg-warning">Justificado</span>'
                  
                  return `
                    <tr>
                      <td>${new Date(att.fecha).toLocaleDateString('es-ES')}</td>
                      <td>${statusBadge}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
  
  container.innerHTML = html
}

function renderStudentEnrollmentCard(item) {
  const section = item.section
  const course = section?.curso
  const teacher = section?.profiles

  const teacherName = teacher
    ? `${teacher.nombre || ''} ${teacher.apellido || ''}`.trim()
    : 'Docente por asignar'

  return `
    <article class="portal-course-item" data-enrollment-id="${item.id}" data-section-id="${section?.id}">
      <div>
        <h5>${course?.nombre || 'Curso sin nombre'}</h5>
        <p>${course?.codigo || '-'} · ${section?.periodo || 'Periodo pendiente'} · ${section?.nombre || 'Sección'}</p>
      </div>
      <div class="portal-course-meta">
        <span><i class="bi bi-person-workspace"></i>${teacherName}</span>
        <span><i class="bi bi-laptop"></i>${section?.modalidad || 'sin modalidad'}</span>
        <span><i class="bi bi-award"></i>Final: ${formatGrade(item.final_grade)}</span>
        <span><i class="bi bi-check2-circle"></i>${translateStatus(item.status)}</span>
      </div>
      <div style="margin-top: 10px;">
        <button class="btn btn-sm btn-outline-primary btn-view-student-course" data-enrollment-id="${item.id}" data-section-id="${section?.id}">
          <i class="bi bi-eye me-1"></i> Ver Detalles
        </button>
      </div>
    </article>
  `
}

function buildDisplayName(user) {
  return [
    user.user_metadata?.primer_nombre,
    user.user_metadata?.apellido_paterno
  ].filter(Boolean).join(' ') || user.email.split('@')[0]
}

function formatGrade(grade) {
  return typeof grade === 'number' ? grade.toFixed(1) : 'N/A'
}

function translateStatus(status) {
  const labels = {
    enrolled: 'Inscrito',
    completed: 'Completado',
    dropped: 'Retirado',
    withdrawn: 'Baja'
  }

  return labels[status] || status || 'Sin estado'
}
