import { supabase } from '../../lib/supabaseClient.js'

let selectedDate = new Date().toISOString().split('T')[0]
let selectedSectionId = null
let currentCourses = []

/**
 * Renderiza la vista principal de asistencia
 */
export async function renderAttendanceView(container) {
  // Cargar todas las secciones de cursos
  const { data: sections, error } = await supabase
    .from('course_sections')
    .select(`
      id,
      periodo,
      nombre,
      curso:courses(
        id,
        nombre,
        codigo
      )
    `)
    .order('periodo', { ascending: false })

  if (error) {
    container.innerHTML = `
      <div class="alert alert-danger m-4">
        Error al cargar cursos: ${error.message}
      </div>
    `
    return
  }

  currentCourses = sections || []

  container.innerHTML = `
    <div class="container-fluid p-4">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><i class="bi bi-calendar-check-fill me-2" style="color: #4a90e2;"></i>Control de Asistencia</h2>
          <p class="text-muted mb-0">Registra la asistencia diaria de estudiantes por curso</p>
        </div>
        <div>
          <input type="date" class="form-control" id="attendanceDate" value="${selectedDate}">
        </div>
      </div>

      <!-- Course Selection Cards -->
      <div class="row g-3" id="coursesList">
        ${renderCourseCards(sections)}
      </div>

      <!-- Attendance Panel (hidden initially) -->
      <div id="attendancePanel" style="display: none;">
        <div class="card shadow-sm mt-4">
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0" id="selectedCourseTitle">
              <i class="bi bi-book me-2"></i>
              <span id="courseName"></span>
            </h5>
            <button class="btn btn-light btn-sm" onclick="window.attendanceView.closeCourse()">
              <i class="bi bi-x-lg"></i> Cerrar
            </button>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <strong>Fecha:</strong> <span id="displayDate"></span>
              </div>
              <div>
                <button class="btn btn-success me-2" onclick="window.attendanceView.markAllPresent()">
                  <i class="bi bi-check-all me-1"></i>Marcar Todos Presentes
                </button>
                <button class="btn btn-primary" onclick="window.attendanceView.saveAttendance()">
                  <i class="bi bi-save me-1"></i>Guardar Asistencia
                </button>
              </div>
            </div>

            <!-- Students List -->
            <div id="studentsList"></div>

            <!-- Summary -->
            <div class="alert alert-info mt-3 d-flex justify-content-around" id="attendanceSummary">
              <div><strong>Presentes:</strong> <span id="presentCount">0</span></div>
              <div><strong>Ausentes:</strong> <span id="absentCount">0</span></div>
              <div><strong>Total:</strong> <span id="totalCount">0</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  attachEventListeners()
}

/**
 * Renderiza las tarjetas de cursos
 */
function renderCourseCards(sections) {
  if (!sections || sections.length === 0) {
    return '<div class="col-12"><div class="alert alert-info">No hay cursos disponibles</div></div>'
  }

  return sections.map(section => {
    const course = section.curso
    if (!course) return ''
    
    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm course-card" style="cursor: pointer; transition: transform 0.2s;" 
             onclick="window.attendanceView.openCourse('${section.id}')">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 class="card-title mb-1">${course.nombre}</h5>
                <small class="text-muted">${course.codigo}</small>
              </div>
              <span class="badge bg-primary">${section.periodo}</span>
            </div>
            <p class="text-muted mb-2">${section.nombre || 'Sección A'}</p>
            <div class="d-flex align-items-center text-primary">
              <i class="bi bi-arrow-right-circle me-2"></i>
              <span>Tomar asistencia</span>
            </div>
          </div>
        </div>
      </div>
    `
  }).join('')
}

/**
 * Abre el panel de asistencia para un curso
 */
async function openCourse(sectionId) {
  selectedSectionId = sectionId
  
  // Obtener info del curso
  const section = currentCourses.find(s => s.id === sectionId)
  if (!section) return

  const courseName = `${section.curso.nombre} (${section.curso.codigo}) - ${section.nombre || 'Sección A'}`
  document.getElementById('courseName').textContent = courseName
  
  // Formatear fecha para mostrar
  const dateObj = new Date(selectedDate + 'T00:00:00')
  const dateStr = dateObj.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  document.getElementById('displayDate').textContent = dateStr

  // Obtener estudiantes inscritos
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      student:profiles!enrollments_student_id_fkey (
        id,
        primer_nombre,
        segundo_nombre,
        apellido_paterno,
        apellido_materno
      )
    `)
    .eq('section_id', sectionId)
    .eq('status', 'enrolled')
    .order('student(apellido_paterno)', { ascending: true })

  if (error) {
    alert('Error al cargar estudiantes')
    return
  }

  // Obtener asistencia previa para esta fecha
  const enrollmentIds = enrollments.map(e => e.id)
  const { data: existingAttendance } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('attendance_date', selectedDate)
    .in('enrollment_id', enrollmentIds)

  // Obtener total de inasistencias por estudiante (contar 'absent')
  const { data: absenceCounts } = await supabase
    .from('student_attendance')
    .select('enrollment_id, status')
    .in('enrollment_id', enrollmentIds)
    .eq('status', 'absent')

  // Contar ausencias por enrollment_id
  const absenceMap = {}
  if (absenceCounts) {
    absenceCounts.forEach(record => {
      absenceMap[record.enrollment_id] = (absenceMap[record.enrollment_id] || 0) + 1
    })
  }

  // Crear mapa de asistencia existente
  const attendanceMap = {}
  if (existingAttendance) {
    existingAttendance.forEach(att => {
      attendanceMap[att.enrollment_id] = att.status === 'present'
    })
  }

  // Renderizar lista de estudiantes
  const studentsList = document.getElementById('studentsList')
  const studentsHTML = enrollments.map(enrollment => {
    const student = enrollment.student
    if (!student) return ''
    
    const fullName = [
      student.primer_nombre,
      student.segundo_nombre,
      student.apellido_paterno,
      student.apellido_materno
    ].filter(Boolean).join(' ')
    
    const isPresent = attendanceMap[enrollment.id] !== undefined 
      ? attendanceMap[enrollment.id] 
      : true // Por defecto presente
    
    const absences = absenceMap[enrollment.id] || 0
    const absenceText = absences > 0 ? ` (${absences} ${absences === 1 ? 'inasistencia' : 'inasistencias'})` : ''

    return `
      <div class="form-check py-2 px-3 hover-bg-light" style="border-bottom: 1px solid #e9ecef;">
        <input 
          class="form-check-input" 
          type="checkbox" 
          id="student-${enrollment.id}" 
          data-enrollment-id="${enrollment.id}"
          ${isPresent ? 'checked' : ''}
          onchange="window.attendanceView.updateSummary()">
        <label class="form-check-label ms-2" for="student-${enrollment.id}" style="cursor: pointer; flex: 1;">
          <strong>${fullName}</strong>
          ${absences > 0 ? `<span class="text-danger">${absenceText}</span>` : `<span class="text-muted">${absenceText}</span>`}
        </label>
      </div>
    `
  }).join('')

  studentsList.innerHTML = studentsHTML || '<p class="text-muted">No hay estudiantes inscritos</p>'

  // Ocultar cursos, mostrar panel
  document.getElementById('coursesList').style.display = 'none'
  document.getElementById('attendancePanel').style.display = 'block'

  // Actualizar resumen
  updateSummary()
}

/**
 * Cierra el panel de asistencia
 */
function closeCourse() {
  document.getElementById('coursesList').style.display = ''
  document.getElementById('attendancePanel').style.display = 'none'
  selectedSectionId = null
}

/**
 * Marca todos como presentes
 */
function markAllPresent() {
  const checkboxes = document.querySelectorAll('#studentsList input[type="checkbox"]')
  checkboxes.forEach(cb => {
    cb.checked = true
  })
  updateSummary()
}

/**
 * Actualiza el resumen de asistencia
 */
function updateSummary() {
  const checkboxes = document.querySelectorAll('#studentsList input[type="checkbox"]')
  const total = checkboxes.length
  const present = Array.from(checkboxes).filter(cb => cb.checked).length
  const absent = total - present

  document.getElementById('presentCount').textContent = present
  document.getElementById('absentCount').textContent = absent
  document.getElementById('totalCount').textContent = total
}

/**
 * Guarda la asistencia en la base de datos
 */
async function saveAttendance() {
  if (!selectedSectionId) return

  const checkboxes = document.querySelectorAll('#studentsList input[type="checkbox"]')
  const { data: user } = await supabase.auth.getUser()

  const attendanceRecords = []
  
  for (const checkbox of checkboxes) {
    const enrollmentId = checkbox.dataset.enrollmentId
    const status = checkbox.checked ? 'present' : 'absent'
    
    attendanceRecords.push({
      enrollment_id: enrollmentId,
      attendance_date: selectedDate,
      status: status,
      recorded_by: user.user.id
    })
  }

  // Primero eliminar registros existentes para esta fecha
  const enrollmentIds = Array.from(checkboxes).map(cb => cb.dataset.enrollmentId)
  await supabase
    .from('student_attendance')
    .delete()
    .eq('attendance_date', selectedDate)
    .in('enrollment_id', enrollmentIds)

  // Insertar nuevos registros
  const { error } = await supabase
    .from('student_attendance')
    .insert(attendanceRecords)

  if (error) {
    Swal.fire('Error', 'No se pudo guardar la asistencia: ' + error.message, 'error')
  } else {
    Swal.fire({
      icon: 'success',
      title: '¡Guardado!',
      text: 'Asistencia registrada correctamente',
      timer: 1500,
      showConfirmButton: false
    })
    
    // Recargar para actualizar contadores de inasistencias
    setTimeout(() => {
      openCourse(selectedSectionId)
    }, 1500)
  }
}

/**
 * Adjunta event listeners
 */
function attachEventListeners() {
  const dateInput = document.getElementById('attendanceDate')
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      selectedDate = e.target.value
      if (selectedSectionId) {
        openCourse(selectedSectionId) // Recargar con nueva fecha
      }
    })
  }

  // Hover effect para cards
  const cards = document.querySelectorAll('.course-card')
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)'
    })
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)'
    })
  })
}

/**
 * API pública
 */
window.attendanceView = {
  openCourse,
  closeCourse,
  markAllPresent,
  updateSummary,
  saveAttendance
}
