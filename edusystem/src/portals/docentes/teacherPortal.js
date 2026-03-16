import { supabase } from '../../lib/supabaseClient.js'
import { renderAttendanceView } from '../../modules/attendance/attendanceView.js'
import * as bootstrap from 'bootstrap'

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
      teacher:profiles(nombre, apellido, email),
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

  // Get enrollment count
  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', sectionId)
    .eq('estado', 'activo')

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
            <button class="btn btn-sm btn-outline-secondary" id="btn-back-teacher-courses">
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
            <li class="nav-item">
              <a class="nav-link course-nav-item" href="#" data-tab="students">
                <i class="bi bi-people-fill me-1"></i>Estudiantes
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Contenido -->
      <div id="course-tab-content" style="background: #f8f9fa; min-height: 500px; padding: 20px;">
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
  document.getElementById('btn-back-teacher-courses').addEventListener('click', async () => {
    await renderTeacherCourses(container, user)
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
      
      loadTabContent(tab, sectionId)
    })
  })

  // Cargar tab general por defecto
  await loadTabContent('general', sectionId, section)
}

async function loadTabContent(tabName, sectionId, section = null) {
  const contentDiv = document.getElementById('course-tab-content')
  
  switch(tabName) {
    case 'general':
      await loadGeneralTab(contentDiv, sectionId, section)
      break
    case 'announcements':
      await loadAnuncios(sectionId)
      break
    case 'modules':
      await loadModulos(sectionId)
      break
    case 'assignments':
      await loadTareas(sectionId)
      break
    case 'grades':
      await loadCalificaciones(sectionId)
      break
    case 'attendance':
      await loadAsistencia(sectionId)
      break
    case 'students':
      await loadEstudiantes(sectionId)
      break
  }
}

async function loadGeneralTab(contentDiv, sectionId, section) {
  if (!section) {
    const { data } = await supabase
      .from('course_sections')
      .select(`
        *,
        curso:courses (nombre, codigo, descripcion, creditos),
        teacher:profiles(nombre, apellido, email),
        schedules(dia_semana, hora_inicio, hora_fin)
      `)
      .eq('id', sectionId)
      .single()
    section = data
  }

  const course = section.curso
  const teacher = section.teacher
  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', sectionId)
    .eq('estado', 'activo')

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
                  <small class="text-muted d-block mb-2">Cupo</small>
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

// Load Anuncios
async function loadAnuncios(sectionId) {
  const container = document.getElementById('course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: anuncios, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('section_id', sectionId)
    .order('created_at', { ascending: false })

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando anuncios: ${error.message}</div>`
    return
  }

  const html = `
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-lg-8">
          <button class="btn btn-primary btn-sm" id="btn-create-announcement">
            <i class="bi bi-plus-circle me-2"></i>Crear Anuncio
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-8">
          ${!anuncios || anuncios.length === 0 
            ? '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay anuncios disponibles</div>'
            : anuncios.map(ann => `
            <div class="card border-0 shadow-sm mb-3" id="announcement-${ann.id}">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="card-title mb-0">${ann.titulo || 'Sin título'}</h6>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-edit-announcement" data-id="${ann.id}" data-title="${ann.titulo || ''}" data-content="${ann.contenido || ''}" title="Editar">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-delete-announcement" data-id="${ann.id}" title="Eliminar">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
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

  // Event listeners for CRUD operations
  document.getElementById('btn-create-announcement')?.addEventListener('click', () => {
    showAnnouncementModal(sectionId, null, () => loadAnuncios(sectionId))
  })

  document.querySelectorAll('.btn-edit-announcement').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id
      const title = e.currentTarget.dataset.title
      const content = e.currentTarget.dataset.content
      showAnnouncementModal(sectionId, { id, titulo: title, contenido: content }, () => loadAnuncios(sectionId))
    })
  })

  document.querySelectorAll('.btn-delete-announcement').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id
      if (confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id)
        if (error) {
          alert('Error al eliminar el anuncio: ' + error.message)
        } else {
          loadAnuncios(sectionId)
        }
      }
    })
  })
}

// Modal para crear/editar anuncios
async function showAnnouncementModal(sectionId, announcement = null, onSuccess = null) {
  const isEdit = !!announcement
  const title = isEdit ? 'Editar Anuncio' : 'Crear Anuncio'
  
  const modalHTML = `
    <div class="modal fade" id="announcementModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="announcementForm">
              <div class="mb-3">
                <label class="form-label">Título</label>
                <input type="text" class="form-control" id="announcementTitle" value="${announcement?.titulo || ''}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Contenido</label>
                <textarea class="form-control" id="announcementContent" rows="4" required>${announcement?.contenido || ''}</textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="savAnnouncementBtn">${isEdit ? 'Actualizar' : 'Crear'}</button>
          </div>
        </div>
      </div>
    </div>
  `

  // Remove old modal if exists
  const oldModal = document.getElementById('announcementModal')
  if (oldModal) oldModal.remove()

  document.body.insertAdjacentHTML('beforeend', modalHTML)
  const modal = new bootstrap.Modal(document.getElementById('announcementModal'))
  
  document.getElementById('savAnnouncementBtn').addEventListener('click', async () => {
    const titulo = document.getElementById('announcementTitle').value
    const contenido = document.getElementById('announcementContent').value

    if (!titulo || !contenido) {
      alert('Por favor completa todos los campos')
      return
    }

    const payload = {
      titulo,
      contenido,
      section_id: sectionId,
      created_at: new Date().toISOString()
    }

    const { error } = isEdit
      ? await supabase.from('announcements').update({ titulo, contenido }).eq('id', announcement.id)
      : await supabase.from('announcements').insert([payload])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      modal.hide()
      document.getElementById('announcementModal')?.remove()
      if (onSuccess) onSuccess()
    }
  })

  modal.show()
}

// Load Módulos
async function loadModulos(sectionId) {
  const container = document.getElementById('course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: modulos, error } = await supabase
    .from('study_resources')
    .select('*')
    .eq('section_id', sectionId)
    .eq('tipo', 'documento')
    .order('created_at', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando módulos: ${error.message}</div>`
    return
  }

  const html = `
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-lg-8">
          <button class="btn btn-primary btn-sm" id="btn-create-module">
            <i class="bi bi-plus-circle me-2"></i>Crear Módulo
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-8">
          ${!modulos || modulos.length === 0 
            ? '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay módulos disponibles. Crea el primer módulo para que los estudiantes vean el contenido del curso.</div>'
            : modulos.map((mod, idx) => `
            <div class="card border-0 shadow-sm mb-3" id="module-${mod.id}">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="card-title mb-0"><span class="badge bg-primary me-2">${idx + 1}</span>${mod.title || 'Sin título'}</h6>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-edit-module" data-id="${mod.id}" title="Editar">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-delete-module" data-id="${mod.id}" title="Eliminar">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                <p class="card-text text-muted mb-2">${mod.description || ''}</p>
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

  // Event listeners for CRUD operations
  document.getElementById('btn-create-module')?.addEventListener('click', () => {
    showModuleModal(sectionId, null, () => loadModulos(sectionId))
  })

  document.querySelectorAll('.btn-edit-module').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id
      const { data: module } = await supabase.from('study_resources').select('*').eq('id', id).single()
      showModuleModal(sectionId, module, () => loadModulos(sectionId))
    })
  })

  document.querySelectorAll('.btn-delete-module').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id
      if (confirm('¿Estás seguro de que deseas eliminar este módulo?')) {
        const { error } = await supabase.from('study_resources').delete().eq('id', id)
        if (error) {
          alert('Error al eliminar el módulo: ' + error.message)
        } else {
          loadModulos(sectionId)
        }
      }
    })
  })
}

// Load Tareas
async function loadTareas(sectionId) {
  const container = document.getElementById('course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  const { data: tareas, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('section_id', sectionId)
    .order('created_at', { ascending: false })

  if (error) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando tareas: ${error.message}</div>`
    return
  }

  const html = `
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-lg-10">
          <button class="btn btn-primary btn-sm" id="btn-create-task">
            <i class="bi bi-plus-circle me-2"></i>Crear Tarea
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-10">
          ${!tareas || tareas.length === 0 
            ? '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay tareas disponibles</div>'
            : `<div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Fecha Límite</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${tareas.map(tarea => `
                  <tr>
                    <td><strong>${tarea.titulo || '-'}</strong></td>
                    <td>${tarea.descripcion?.substring(0, 50) || '-'}${tarea.descripcion?.length > 50 ? '...' : ''}</td>
                    <td><small>${tarea.fecha_limite ? new Date(tarea.fecha_limite).toLocaleDateString('es-ES') : '-'}</small></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary btn-edit-task" data-id="${tarea.id}" title="Editar">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger btn-delete-task" data-id="${tarea.id}" title="Eliminar">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>
    </div>
  `
  container.innerHTML = html

  // Event listeners for CRUD operations
  document.getElementById('btn-create-task')?.addEventListener('click', () => {
    showTaskModal(sectionId, null, () => loadTareas(sectionId))
  })

  document.querySelectorAll('.btn-edit-task').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id
      const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()
      showTaskModal(sectionId, task, () => loadTareas(sectionId))
    })
  })

  document.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id
      if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) {
          alert('Error al eliminar la tarea: ' + error.message)
        } else {
          loadTareas(sectionId)
        }
      }
    })
  })
}

// Load Calificaciones
async function loadCalificaciones(sectionId) {
  const container = document.getElementById('course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  // Query 1: Get enrollments
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, student_id, calificacion_final')
    .eq('section_id', sectionId)

  if (enrollError) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando calificaciones: ${enrollError.message}</div>`
    return
  }

  if (!enrollments?.length) {
    container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos</div>'
    return
  }

  // Query 2: Get student profiles
  const studentIds = enrollments.map(e => e.student_id)
  const { data: students } = await supabase
    .from('students')
    .select('id, profile:profile_id(nombre, apellido, email)')
    .in('id', studentIds)

  // Create map
  const studentMap = {}
  students?.forEach(s => {
    studentMap[s.id] = s.profile
  })

  // Sort by apellido client-side
  const sorted = enrollments.sort((a, b) => {
    const apellidoA = (studentMap[a.student_id]?.apellido || '').toLowerCase()
    const apellidoB = (studentMap[b.student_id]?.apellido || '').toLowerCase()
    return apellidoA.localeCompare(apellidoB)
  })

  const html = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-10">
          ${!enrollments || (sorted || []).length === 0 
            ? '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos</div>'
            : `<div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Estudiante</th>
                  <th>Email</th>
                  <th>Calificación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${(sorted || []).map(enr => {
                  const profile = studentMap[enr.student_id]
                  const calif = enr.calificacion_final
                  const statusBadge = !calif 
                    ? '<span class="badge bg-warning">Pendiente</span>'
                    : calif >= 3.0 
                    ? '<span class="badge bg-success">Aprobado</span>'
                    : '<span class="badge bg-danger">No aprobado</span>'
                  
                  return `
                    <tr>
                      <td><strong>${profile?.nombre || '-'} ${profile?.apellido || ''}</strong></td>
                      <td>${profile?.email || '-'}</td>
                      <td><strong>${calif !== null ? calif.toFixed(1) : '-'}</strong> ${statusBadge}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary btn-grade-student" data-enrollment-id="${enr.id}" title="Calificar">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                      </td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>
    </div>
  `
  container.innerHTML = html

  // Event listeners for grading
  document.querySelectorAll('.btn-grade-student').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const enrollmentId = e.currentTarget.dataset.enrollmentId
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, student_id, calificacion_final, students(profiles(nombre, apellido))')
        .eq('id', enrollmentId)
        .single()
      showGradeModal(enrollmentId, enrollment, () => loadCalificaciones(sectionId))
    })
  })
}

// Load Asistencia
async function loadAsistencia(sectionId) {
  const container = document.getElementById('course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  // Get enrolled students
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, student_id')
    .eq('section_id', sectionId)
    .eq('estado', 'activo')

  if (enrollError) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando estudiantes: ${enrollError.message}</div>`
    return
  }

  if (!enrollments?.length) {
    container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos</div>'
    return
  }

  // Get student data
  const studentIds = enrollments.map(e => e.student_id)
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, profile:profile_id(nombre, apellido)')
    .in('id', studentIds)

  if (studentsError) {
    container.innerHTML = `<div class="alert alert-danger">Error cargando datos: ${studentsError.message}</div>`
    return
  }

  // Create student map
  const studentMap = {}
  students?.forEach(s => {
    studentMap[s.id] = s.profile
  })

  // Sort students by apellido client-side
  const sorted = enrollments.sort((a, b) => {
    const aApellido = studentMap[a.student_id]?.apellido || ''
    const bApellido = studentMap[b.student_id]?.apellido || ''
    return aApellido.localeCompare(bApellido)
  })

  const today = new Date().toISOString().split('T')[0]
  
  // Get today's attendance
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('student_id, estado')
    .eq('section_id', sectionId)
    .eq('fecha', today)

  const attendanceMap = new Map((todayAttendance || []).map(a => [a.student_id, a.estado]))

  const html = `
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-lg-10">
          <h6>Registrar Asistencia - ${new Date(today).toLocaleDateString('es-ES')}</h6>
        </div>
      </div>
      <div class="row">
        <div class="col-lg-10">
          ${!sorted || sorted.length === 0 
            ? '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos</div>'
            : `<form id="attendanceForm">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Estudiante</th>
                    <th>Asistencia</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${sorted.map(enrollment => {
                    const student = studentMap[enrollment.student_id]
                    const currentStatus = attendanceMap.get(enrollment.student_id) || 'presente'
                    
                    return `
                      <tr>
                        <td><strong>${student?.nombre || '-'} ${student?.apellido || ''}</strong></td>
                        <td>
                          <select class="form-select form-select-sm attendance-select" data-student-id="${enrollment.student_id}" data-section-id="${sectionId}" data-date="${today}">
                            <option value="presente" ${currentStatus === 'presente' ? 'selected' : ''}>Presente</option>
                            <option value="ausente" ${currentStatus === 'ausente' ? 'selected' : ''}>Ausente</option>
                            <option value="tarde" ${currentStatus === 'tarde' ? 'selected' : ''}>Tarde</option>
                            <option value="justificado" ${currentStatus === 'justificado' ? 'selected' : ''}>Justificado</option>
                          </select>
                        </td>
                        <td><input type="text" class="form-control form-control-sm attendance-note" placeholder="Nota" data-student-id="${enrollment.student_id}"></td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>
            <div class="mt-3">
              <button type="button" class="btn btn-success" id="saveAttendanceBtn">
                <i class="bi bi-check-circle me-2"></i>Guardar Asistencia
              </button>
            </div>
          </form>`}
        </div>
      </div>
    </div>
  `
  container.innerHTML = html

  // Save attendance
  document.getElementById('saveAttendanceBtn')?.addEventListener('click', async () => {
    const rows = Array.from(document.querySelectorAll('.attendance-select'))
    const records = rows.map(select => ({
      student_id: select.dataset.studentId,
      section_id: select.dataset.sectionId,
      fecha: select.dataset.date,
      estado: select.value
    }))

    // Upsert records
    for (const record of records) {
      const { error } = await supabase
        .from('attendance')
        .upsert([record], { onConflict: 'student_id,section_id,fecha' })
      
      if (error) console.error('Error saving attendance:', error)
    }

    alert('Asistencia guardada correctamente')
    loadAsistencia(sectionId)
  })
}

// Load Estudiantes
async function loadEstudiantes(sectionId) {
  const container = document.getElementById('course-tab-content')
  if (!container) return
  
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>'
  
  // Primero obtener enrollments
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, student_id, fecha_inscripcion')
    .eq('section_id', sectionId)
    .order('fecha_inscripcion', { ascending: false })

  if (enrollError || !enrollments?.length) {
    container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i>No hay estudiantes inscritos</div>'
    return
  }

  // Obtener los student_ids
  const studentIds = enrollments.map(e => e.student_id)

  // Luego obtener los datos de students y profiles
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      profile:profile_id(nombre, apellido, email)
    `)
    .in('id', studentIds)

  if (studentsError) {
    console.error('Error en query students:', studentsError)
    container.innerHTML = `<div class="alert alert-danger">Error cargando perfiles: ${studentsError.message}</div>`
    return
  }

  if (!students?.length) {
    console.error('No students returned. Enrollments:', enrollments, 'Student IDs:', studentIds)
    container.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>No se encontraron datos de estudiantes</div>'
    return
  }

  // Crear un mapa de student_id -> profile
  const studentMap = {}
  students.forEach(s => {
    if (s.profile) {
      studentMap[s.id] = s.profile
    } else {
      console.warn('Estudiante sin profile:', s)
    }
  })

  const html = `
    <div class="container-fluid">
      <div class="row">
        <div class="col-lg-10">
          <div class="mb-3">
            <strong>${enrollments.length}</strong> estudiantes inscritos
          </div>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Inscripción</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${enrollments.map(enr => {
                  const profile = studentMap[enr.student_id]
                  if (!profile) {
                    console.warn('No profile for enrollment:', enr)
                  }
                  
                  return `
                    <tr>
                      <td><strong>${profile?.nombre || 'Sin nombre'} ${profile?.apellido || ''}</strong></td>
                      <td>${profile?.email || 'Sin email'}</td>
                      <td><small>${new Date(enr.fecha_inscripcion).toLocaleDateString('es-ES')}</small></td>
                      <td><span class="badge bg-success">Activo</span></td>
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
      student_id,
      students(
        id,
        matricula,
        profiles(
          nombre,
          apellido,
          email,
          telefono
        )
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
    return '<tr><td colspan="5" class="text-center text-muted py-4">Sin estudiantes inscritos en tus grupos.</td></tr>'
  }

  return entries.flatMap(([sectionId, enrollments]) => {
    const section = sectionMap.get(sectionId)
    const groupName = section?.nombre || 'Sección'
    const courseLabel = `${section?.curso?.nombre || 'Curso'} (${section?.curso?.codigo || '-'})`

    return enrollments.map((enrollment, index) => {
      const profile = enrollment.students?.profiles
      const studentName = `${profile?.nombre || '-'} ${profile?.apellido || ''}`

      return `
        <tr>
          <td>${index === 0 ? `${groupName} · ${section?.periodo || ''}` : ''}</td>
          <td>${index === 0 ? courseLabel : ''}</td>
          <td>${studentName}</td>
          <td>${enrollment.students?.matricula || '-'}</td>
          <td>${profile?.email || '-'}</td>
          <td>${profile?.telefono || '-'}</td>
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

// Modal para crear/editar módulos
async function showModuleModal(sectionId, module = null, onSuccess = null) {
  const isEdit = !!module
  const title = isEdit ? 'Editar Módulo' : 'Crear Módulo'
  
  const modalHTML = `
    <div class="modal fade" id="moduleModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="moduleForm">
              <div class="mb-3">
                <label class="form-label">Título del Módulo</label>
                <input type="text" class="form-control" id="moduleTitle" value="${module?.title || ''}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" id="moduleDescription" rows="3" required>${module?.description || ''}</textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Archivo (PDF, ZIP, etc.)</label>
                <input type="file" class="form-control" id="moduleFile" accept=".pdf,.zip,.docx,.pptx,.xlsx">
                ${module?.archivo_url ? `<small class="text-muted d-block mt-2">Archivo actual: <a href="${module.archivo_url}" target="_blank">Ver archivo</a></small>` : ''}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveModuleBtn">${isEdit ? 'Actualizar' : 'Crear'}</button>
          </div>
        </div>
      </div>
    </div>
  `

  // Remove old modal if exists
  const oldModal = document.getElementById('moduleModal')
  if (oldModal) oldModal.remove()

  document.body.insertAdjacentHTML('beforeend', modalHTML)
  const modal = new bootstrap.Modal(document.getElementById('moduleModal'))
  
  document.getElementById('saveModuleBtn').addEventListener('click', async () => {
    const title = document.getElementById('moduleTitle').value
    const description = document.getElementById('moduleDescription').value
    const fileInput = document.getElementById('moduleFile')

    if (!title || !description) {
      alert('Por favor completa título y descripción')
      return
    }

    let file_url = module?.archivo_url || null

    // Upload file if provided
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0]
      const fileName = `modules/${sectionId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, file)
      
      if (uploadError) {
        alert('Error al subir archivo: ' + uploadError.message)
        return
      }

      const { data } = supabase.storage.from('course-materials').getPublicUrl(fileName)
      file_url = data.publicUrl
    }

    const payload = {
      titulo: title,
      descripcion: description,
      tipo: 'documento',
      section_id: sectionId,
      archivo_url: file_url,
      created_at: new Date().toISOString()
    }

    const { error } = isEdit
      ? await supabase.from('study_resources').update({ titulo: title, descripcion: description, archivo_url: file_url }).eq('id', module.id)
      : await supabase.from('study_resources').insert([payload])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      modal.hide()
      document.getElementById('moduleModal')?.remove()
      if (onSuccess) onSuccess()
    }
  })

  modal.show()
}

// Modal para crear/editar tareas
async function showTaskModal(sectionId, task = null, onSuccess = null) {
  const isEdit = !!task
  const title = isEdit ? 'Editar Tarea' : 'Crear Tarea'
  
  const modalHTML = `
    <div class="modal fade" id="taskModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="taskForm">
              <div class="mb-3">
                <label class="form-label">Título de la Tarea</label>
                <input type="text" class="form-control" id="taskTitle" value="${task?.titulo || ''}" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" id="taskDescription" rows="4" required>${task?.descripcion || ''}</textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Fecha Límite (opcional)</label>
                <input type="datetime-local" class="form-control" id="taskDueDate" value="${task?.fecha_limite ? task.fecha_limite.slice(0, 16) : ''}">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveTaskBtn">${isEdit ? 'Actualizar' : 'Crear'}</button>
          </div>
        </div>
      </div>
    </div>
  `

  const oldModal = document.getElementById('taskModal')
  if (oldModal) oldModal.remove()

  document.body.insertAdjacentHTML('beforeend', modalHTML)
  const modal = new bootstrap.Modal(document.getElementById('taskModal'))
  
  document.getElementById('saveTaskBtn').addEventListener('click', async () => {
    const titleVal = document.getElementById('taskTitle').value
    const description = document.getElementById('taskDescription').value
    const dueDate = document.getElementById('taskDueDate').value

    if (!titleVal || !description) {
      alert('Por favor completa título y descripción')
      return
    }

    const payload = {
      titulo: titleVal,
      descripcion: description,
      section_id: sectionId,
      fecha_limite: dueDate ? new Date(dueDate).toISOString() : null,
      fecha_asignacion: new Date().toISOString(),
      tipo: 'tarea'
    }

    const { error } = isEdit
      ? await supabase.from('tasks').update({ titulo: titleVal, descripcion: description, fecha_limite: dueDate ? new Date(dueDate).toISOString() : null }).eq('id', task.id)
      : await supabase.from('tasks').insert([payload])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      modal.hide()
      document.getElementById('taskModal')?.remove()
      if (onSuccess) onSuccess()
    }
  })

  modal.show()
}

// Modal para calificar estudiantes
async function showGradeModal(enrollmentId, enrollment, onSuccess = null) {
  const student = enrollment.students?.profiles
  const studentName = `${student?.nombre || '-'} ${student?.apellido || ''}`
  
  const modalHTML = `
    <div class="modal fade" id="gradeModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Calificar a ${studentName}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="gradeForm">
              <div class="mb-3">
                <label class="form-label">Calificación (0.0 - 5.0)</label>
                <input type="number" class="form-control" id="gradeValue" min="0" max="5" step="0.1" value="${enrollment?.calificacion_final || ''}" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveGradeBtn">Guardar Calificación</button>
          </div>
        </div>
      </div>
    </div>
  `

  const oldModal = document.getElementById('gradeModal')
  if (oldModal) oldModal.remove()

  document.body.insertAdjacentHTML('beforeend', modalHTML)
  const modal = new bootstrap.Modal(document.getElementById('gradeModal'))
  
  document.getElementById('saveGradeBtn').addEventListener('click', async () => {
    const calificacion = parseFloat(document.getElementById('gradeValue').value)

    if (isNaN(calificacion) || calificacion < 0 || calificacion > 5) {
      alert('Por favor ingresa una calificación válida entre 0.0 y 5.0')
      return
    }

    const { error } = await supabase
      .from('enrollments')
      .update({ calificacion_final: calificacion })
      .eq('id', enrollmentId)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      modal.hide()
      document.getElementById('gradeModal')?.remove()
      if (onSuccess) onSuccess()
    }
  })

  modal.show()
}

function buildDisplayName(user) {
  return [
    user.user_metadata?.nombre,
    user.user_metadata?.apellido
  ].filter(Boolean).join(' ') || user.email.split('@')[0]
}

function formatSchedule(item) {
  const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
  const dayName = dias[item.dia_semana] || 'Dia'
  const start = item.hora_inicio ? item.hora_inicio.slice(0, 5) : '--:--'
  const end = item.hora_fin ? item.hora_fin.slice(0, 5) : '--:--'
  return `${dayName} ${start}-${end}`
}
