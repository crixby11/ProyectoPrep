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
      .eq('estado', 'activo')

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
          primer_nombre,
          segundo_nombre,
          apellido_paterno,
          apellido_materno
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
          .eq('estado', 'activo')

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
        `${teacher.primer_nombre || ''} ${teacher.apellido_paterno || ''}`.trim() : 
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
          primer_nombre,
          apellido_paterno
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

function renderStudentEnrollmentCard(item) {
  const section = item.section
  const course = section?.curso
  const teacher = section?.profiles

  const teacherName = teacher
    ? `${teacher.primer_nombre || ''} ${teacher.apellido_paterno || ''}`.trim()
    : 'Docente por asignar'

  return `
    <article class="portal-course-item">
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
