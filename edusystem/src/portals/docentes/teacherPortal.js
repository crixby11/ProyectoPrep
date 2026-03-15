import { supabase } from '../../lib/supabaseClient.js'
import { renderAttendanceView } from '../../modules/attendance/attendanceView.js'

export function getTeacherPortalModules() {
  return [
    {
      id: 'dashboard',
      label: 'Resumen',
      icon: 'bi-grid-fill',
      description: 'Vista general de tu semana'
    },
    {
      id: 'teacher-courses',
      label: 'Mis Cursos',
      icon: 'bi-journal-bookmark-fill',
      description: 'Grupos asignados y seguimiento'
    },
    {
      id: 'teacher-students',
      label: 'Mis Estudiantes',
      icon: 'bi-people-fill',
      description: 'Listado por grupo y contacto'
    },
    {
      id: 'attendance',
      label: 'Asistencia',
      icon: 'bi-calendar2-check-fill',
      description: 'Registro diario por grupo'
    }
  ]
}

export async function renderTeacherPortalView(container, moduleId, user) {
  switch (moduleId) {
    case 'dashboard':
      await renderTeacherHome(container, user)
      break
    case 'teacher-courses':
      await renderTeacherCourses(container, user)
      break
    case 'teacher-students':
      await renderTeacherStudents(container, user)
      break
    case 'attendance':
      await renderAttendanceView(container, { teacherId: user.id })
      break
    default:
      container.innerHTML = '<div class="alert alert-warning">Módulo no disponible para docentes.</div>'
  }
}

async function renderTeacherHome(container, user) {
  const teacherName = buildDisplayName(user)

  const { data: sections, error } = await supabase
    .from('course_sections')
    .select('id')
    .eq('teacher_id', user.id)

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando resumen docente: ${error.message}</div>`
    return
  }

  const sectionIds = (sections || []).map(section => section.id)
  let enrolledCount = 0

  if (sectionIds.length > 0) {
    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .in('section_id', sectionIds)
      .eq('status', 'enrolled')

    enrolledCount = count || 0
  }

  container.innerHTML = `
    <section class="portal-hero portal-hero-teacher">
      <div>
        <h2>Panel Docente</h2>
        <p>Hola ${teacherName}, aquí tienes una vista rápida de tu carga académica.</p>
      </div>
      <div class="portal-hero-chip">
        <i class="bi bi-lightning-charge-fill"></i>
        <span>Semana Activa</span>
      </div>
    </section>

    <section class="portal-grid portal-grid-3">
      <article class="portal-card metric">
        <small>Grupos asignados</small>
        <h3>${sectionIds.length}</h3>
      </article>
      <article class="portal-card metric">
        <small>Estudiantes inscritos</small>
        <h3>${enrolledCount}</h3>
      </article>
      <article class="portal-card metric">
        <small>Acción recomendada</small>
        <h3 class="metric-text">Tomar asistencia hoy</h3>
      </article>
    </section>

    <section class="portal-card">
      <h4>Tu flujo de trabajo</h4>
      <div class="portal-shortcuts">
        <button class="portal-shortcut" data-teacher-view="teacher-courses">
          <i class="bi bi-journal-text"></i>
          <span>Ver grupos</span>
        </button>
        <button class="portal-shortcut" data-teacher-view="teacher-students">
          <i class="bi bi-people"></i>
          <span>Ver estudiantes</span>
        </button>
        <button class="portal-shortcut" data-teacher-view="attendance">
          <i class="bi bi-calendar-check"></i>
          <span>Tomar asistencia</span>
        </button>
      </div>
    </section>
  `
}

async function renderTeacherCourses(container, user) {
  const { data: sections, error } = await supabase
    .from('course_sections')
    .select(`
      id,
      nombre,
      periodo,
      cupo_maximo,
      modalidad,
      curso:courses (
        id,
        nombre,
        codigo
      ),
      schedules (
        dia_semana,
        hora_inicio,
        hora_fin
      )
    `)
    .eq('teacher_id', user.id)
    .order('periodo', { ascending: false })

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando tus cursos: ${error.message}</div>`
    return
  }

  if (!sections || sections.length === 0) {
    container.innerHTML = `
      <section class="portal-card empty-state">
        <i class="bi bi-inbox"></i>
        <h4>Sin cursos asignados</h4>
        <p>Aún no tienes grupos asignados. Contacta al administrador para la programación académica.</p>
      </section>
    `
    return
  }

  container.innerHTML = `
    <section class="portal-card">
      <div class="portal-card-header-inline">
        <h4>Mis Cursos</h4>
        <span class="portal-badge">${sections.length} grupos</span>
      </div>
      <div class="portal-course-list">
        ${sections.map(renderTeacherSectionCard).join('')}
      </div>
    </section>
  `
}

async function renderTeacherStudents(container, user) {
  const { data: sections, error: sectionsError } = await supabase
    .from('course_sections')
    .select(`
      id,
      nombre,
      periodo,
      curso:courses (
        nombre,
        codigo
      )
    `)
    .eq('teacher_id', user.id)
    .order('periodo', { ascending: false })

  if (sectionsError) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando grupos: ${sectionsError.message}</div>`
    return
  }

  const sectionIds = (sections || []).map(section => section.id)

  if (sectionIds.length === 0) {
    container.innerHTML = `
      <section class="portal-card empty-state">
        <i class="bi bi-journal-x"></i>
        <h4>Sin grupos asignados</h4>
        <p>No hay grupos vinculados a tu cuenta docente todavía.</p>
      </section>
    `
    return
  }

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select(`
      id,
      section_id,
      status,
      student:profiles!enrollments_student_id_fkey (
        id,
        primer_nombre,
        segundo_nombre,
        apellido_paterno,
        apellido_materno,
        email,
        telefono,
        matricula
      )
    `)
    .in('section_id', sectionIds)
    .eq('status', 'enrolled')

  if (enrollmentsError) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando estudiantes: ${enrollmentsError.message}</div>`
    return
  }

  const sectionMap = new Map((sections || []).map(item => [item.id, item]))

  const grouped = (enrollments || []).reduce((acc, enrollment) => {
    const key = enrollment.section_id
    if (!acc[key]) acc[key] = []
    acc[key].push(enrollment)
    return acc
  }, {})

  container.innerHTML = `
    <section class="portal-card">
      <div class="portal-card-header-inline">
        <h4>Mis Estudiantes</h4>
        <span class="portal-badge">${enrollments?.length || 0} inscritos</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Curso</th>
              <th>Estudiante</th>
              <th>Matrícula</th>
              <th>Email</th>
              <th>Teléfono</th>
            </tr>
          </thead>
          <tbody>
            ${renderTeacherStudentsRows(grouped, sectionMap)}
          </tbody>
        </table>
      </div>
    </section>
  `
}

function renderTeacherStudentsRows(grouped, sectionMap) {
  const entries = Object.entries(grouped)

  if (entries.length === 0) {
    return '<tr><td colspan="6" class="text-center text-muted py-4">Sin estudiantes inscritos en tus grupos.</td></tr>'
  }

  return entries.flatMap(([sectionId, enrollments]) => {
    const section = sectionMap.get(sectionId)
    const groupName = section?.nombre || 'Sección'
    const courseLabel = `${section?.curso?.nombre || 'Curso'} (${section?.curso?.codigo || '-'})`

    return enrollments.map((enrollment, index) => {
      const student = enrollment.student
      const studentName = [
        student?.primer_nombre,
        student?.segundo_nombre,
        student?.apellido_paterno,
        student?.apellido_materno
      ].filter(Boolean).join(' ') || 'Sin nombre'

      return `
        <tr>
          <td>${index === 0 ? `${groupName} · ${section?.periodo || ''}` : ''}</td>
          <td>${index === 0 ? courseLabel : ''}</td>
          <td>${studentName}</td>
          <td>${student?.matricula || '-'}</td>
          <td>${student?.email || '-'}</td>
          <td>${student?.telefono || '-'}</td>
        </tr>
      `
    })
  }).join('')
}

function renderTeacherSectionCard(section) {
  const course = section.curso
  const schedules = section.schedules || []

  const scheduleText = schedules.length
    ? schedules.map(formatSchedule).join(' · ')
    : 'Horario pendiente'

  return `
    <article class="portal-course-item">
      <div>
        <h5>${course?.nombre || 'Curso sin nombre'}</h5>
        <p>${course?.codigo || '-'} · ${section.nombre || 'Sección'} · ${section.periodo || 'Periodo no definido'}</p>
      </div>
      <div class="portal-course-meta">
        <span><i class="bi bi-clock"></i>${scheduleText}</span>
        <span><i class="bi bi-people"></i>Cupo: ${section.cupo_maximo || 0}</span>
        <span><i class="bi bi-laptop"></i>${section.modalidad || 'sin modalidad'}</span>
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

function formatSchedule(item) {
  const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const dayName = dias[item.dia_semana] || 'Dia'
  const start = item.hora_inicio ? item.hora_inicio.slice(0, 5) : '--:--'
  const end = item.hora_fin ? item.hora_fin.slice(0, 5) : '--:--'
  return `${dayName} ${start}-${end}`
}
