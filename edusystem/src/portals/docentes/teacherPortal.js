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
      activo,
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
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Sección</th>
              <th>Horario</th>
              <th>Cupos</th>
              <th>Modalidad</th>
              <th>Estado</th>
              <th class="text-center" style="width: 60px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${sections.map(section => renderTeacherCourseRow(section, user)).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `

  // Add event listeners for view details buttons
  container.querySelectorAll('.btn-view-course-details').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      const sectionId = btn.dataset.sectionId
      await showTeacherCourseDetails(container, sectionId, user)
    })
  })
}

function renderTeacherCourseRow(section, user) {
  const course = section.curso
  const schedules = section.schedules || []
  
  const scheduleText = schedules.length
    ? schedules.map(formatSchedule).join(' · ')
    : 'Pendiente'
  
  const stateLabel = section.activo 
    ? '<span class="badge bg-success">Activo</span>'
    : '<span class="badge bg-secondary">Inactivo</span>'

  return `
    <tr>
      <td><strong>${course?.codigo || '-'}</strong></td>
      <td>${course?.nombre || 'Curso sin nombre'}</td>
      <td>${section.nombre || '-'}</td>
      <td>${scheduleText}</td>
      <td>${section.cupo_maximo || 0}</td>
      <td>${section.modalidad || '-'}</td>
      <td>${stateLabel}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary btn-view-course-details" 
                data-section-id="${section.id}"
                title="Ver detalles del curso">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    </tr>
  `
}

async function showTeacherCourseDetails(container, sectionId, user) {
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
    alert(`Error cargando detalles del curso: ${error.message}`)
    return
  }

  const course = section.curso
  const teacher = section.teacher

  // Get enrollment count
  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', sectionId)
    .eq('estado', 'activo')

  const schedules = section.schedules || []
  const scheduleText = schedules.length
    ? schedules.map(formatSchedule).join(' • ')
    : 'Horario pendiente'

  const teacherDisplayName = [teacher?.primer_nombre, teacher?.apellido_paterno]
    .filter(Boolean)
    .join(' ') || 'Docente'

  const detailsHTML = `
    <section class="portal-card pb-0">
      <!-- Header -->
      <div class="d-flex align-items-start justify-content-between mb-4">
        <div>
          <button class="btn btn-link btn-sm p-0 mb-2" id="btn-back-to-courses">
            <i class="bi bi-arrow-left"></i> Volver
          </button>
          <h2 style="margin: 0;">${course?.nombre || 'Curso'}</h2>
          <p class="text-muted mb-0">${course?.codigo || '-'} • ${teacherDisplayName} • ${enrollmentCount || 0} estudiantes</p>
        </div>
        <div class="d-flex gap-2">
          ${section.activo 
            ? '<span class="badge bg-success">Activo</span>'
            : '<span class="badge bg-secondary">Inactivo</span>'}
        </div>
      </div>

      <!-- Tabs Navigation -->
      <ul class="nav nav-tabs border-bottom mb-4" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="tab-inicio" data-bs-toggle="tab" data-bs-target="#content-inicio" type="button" role="tab">
            <i class="bi bi-house"></i> Inicio
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-anuncios" data-bs-toggle="tab" data-bs-target="#content-anuncios" type="button" role="tab">
            <i class="bi bi-megaphone"></i> Anuncios
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-modulos" data-bs-toggle="tab" data-bs-target="#content-modulos" type="button" role="tab">
            <i class="bi bi-folder"></i> Módulos
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-tareas" data-bs-toggle="tab" data-bs-target="#content-tareas" type="button" role="tab">
            <i class="bi bi-tasks"></i> Tareas
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-calificaciones" data-bs-toggle="tab" data-bs-target="#content-calificaciones" type="button" role="tab">
            <i class="bi bi-graph-up"></i> Calificaciones
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-asistencia" data-bs-toggle="tab" data-bs-target="#content-asistencia" type="button" role="tab">
            <i class="bi bi-calendar-check"></i> Asistencia
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tab-estudiantes" data-bs-toggle="tab" data-bs-target="#content-estudiantes" type="button" role="tab">
            <i class="bi bi-people"></i> Estudiantes
          </button>
        </li>
      </ul>
    </section>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Inicio Tab -->
      <div class="tab-pane fade show active" id="content-inicio" role="tabpanel">
        <section class="portal-card">
          <div class="row">
            <!-- Left Column: Course Info -->
            <div class="col-lg-8">
              <h5 class="mb-3">${course?.nombre || 'Curso'}</h5>
              <p class="text-muted mb-3">
                <i class="bi bi-bookmark"></i> ${course?.codigo || '-'}
              </p>
              <p class="mb-4">${course?.descripcion || 'Sin descripción disponible'}</p>

              <h6 class="mb-3">Detalles</h6>
              <div class="row mb-4">
                <div class="col-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Departamento</small>
                    <strong>N/A</strong>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Nivel</small>
                    <strong>${section.modalidad || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Créditos</small>
                    <strong><i class="bi bi-star"></i> ${course?.creditos || 0}</strong>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mb-3">
                    <small class="text-muted d-block">Período</small>
                    <strong><i class="bi bi-calendar"></i> ${section.periodo || '-'}</strong>
                  </div>
                </div>
              </div>

              <!-- Statistics Cards -->
              <div class="row mt-4">
                <div class="col-md-4">
                  <div class="card text-center border-0 bg-light">
                    <div class="card-body p-3">
                      <h6 class="card-title text-muted small">Cupo</h6>
                      <h4 class="mb-0">${section.cupo_maximo || 0}</h4>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card text-center border-0 bg-light">
                    <div class="card-body p-3">
                      <h6 class="card-title text-muted small">Inscritos</h6>
                      <h4 class="mb-0">${enrollmentCount || 0}</h4>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card text-center border-0 bg-light">
                    <div class="card-body p-3">
                      <h6 class="card-title text-muted small">Disponibles</h6>
                      <h4 class="mb-0 ${(section.cupo_maximo - (enrollmentCount || 0)) > 0 ? 'text-success' : 'text-danger'}">${Math.max(0, section.cupo_maximo - (enrollmentCount || 0))}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Teacher & Schedule Info -->
            <div class="col-lg-4">
              <!-- Teacher Card -->
              <div class="mb-4">
                <h6 class="mb-3"><i class="bi bi-person-circle"></i> Profesor</h6>
                <div class="card border-0 bg-light p-3 text-center">
                  <div class="mb-3">
                    <div class="avatar-placeholder mx-auto mb-2" style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">
                      <i class="bi bi-person"></i>
                    </div>
                  </div>
                  <h6 class="mb-1">${teacherDisplayName}</h6>
                  <small class="text-muted d-block" style="word-break: break-all;">
                    <i class="bi bi-envelope"></i> ${teacher?.email || '-'}
                  </small>
                </div>
              </div>

              <!-- Schedule Card -->
              <div>
                <h6 class="mb-3"><i class="bi bi-clock-history"></i> Horarios</h6>
                <div class="card border-0 bg-light p-3">
                  ${schedules.length > 0
                    ? schedules.map((sch, idx) => `
                        <div class="mb-2">
                          <span class="badge bg-primary">${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][sch.dia_semana] || 'Día'}</span>
                          <strong class="ms-2">${sch.hora_inicio?.slice(0, 5) || '--:--'} - ${sch.hora_fin?.slice(0, 5) || '--:--'}</strong>
                        </div>
                      `).join('')
                    : '<p class="text-muted mb-0">Horario pendiente</p>'}
                  ${section.aula ? `<div class="mt-3 pt-3 border-top"><small class="text-muted">Aula:</small> <strong>${section.aula}</strong></div>` : ''}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Other Tabs (Placeholder) -->
      <div class="tab-pane fade" id="content-anuncios" role="tabpanel">
        <section class="portal-card">
          <p class="text-muted text-center py-5">No hay anuncios disponibles</p>
        </section>
      </div>
      <div class="tab-pane fade" id="content-modulos" role="tabpanel">
        <section class="portal-card">
          <p class="text-muted text-center py-5">No hay módulos disponibles</p>
        </section>
      </div>
      <div class="tab-pane fade" id="content-tareas" role="tabpanel">
        <section class="portal-card">
          <p class="text-muted text-center py-5">No hay tareas disponibles</p>
        </section>
      </div>
      <div class="tab-pane fade" id="content-calificaciones" role="tabpanel">
        <section class="portal-card">
          <p class="text-muted text-center py-5">No hay calificaciones disponibles</p>
        </section>
      </div>
      <div class="tab-pane fade" id="content-asistencia" role="tabpanel">
        <section class="portal-card">
          <p class="text-muted text-center py-5">No hay registros de asistencia</p>
        </section>
      </div>
      <div class="tab-pane fade" id="content-estudiantes" role="tabpanel">
        <section class="portal-card">
          <p class="text-muted text-center py-5">Funcionalidad de estudiantes en desarrollo</p>
        </section>
      </div>
    </div>
  `

  container.innerHTML = detailsHTML

  // Add back button listener
  document.getElementById('btn-back-to-courses').addEventListener('click', async () => {
    await renderTeacherCourses(container, user)
  })
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
