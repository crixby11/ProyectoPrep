import { supabase } from '../../lib/supabaseClient.js'

/**
 * Muestra una notificación de éxito bonita
 */
function showSuccessNotification(title, studentName) {
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
            <i class="bi bi-person me-1"></i>
            ${studentName}
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
 * Renderiza la vista de listado de estudiantes
 */
export async function renderStudentsView(container) {
  // Obtener estudiantes de la base de datos
  const { data: students, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('rol', 'student')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error cargando estudiantes:', error)
  }
  
  container.innerHTML = `
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Gestión de Estudiantes</h2>
          <p class="text-muted mb-0">Administra todos los estudiantes de la institución</p>
        </div>
        <button class="btn btn-primary" id="addStudentBtn">
          <i class="bi bi-plus-circle me-2"></i>
          Nuevo Estudiante
        </button>
      </div>
      
      <!-- Filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <input type="text" class="form-control" id="searchStudent" placeholder="Buscar por nombre o matrícula...">
            </div>
            <div class="col-md-3">
              <select class="form-control" id="filterLevel">
                <option value="">Todos los niveles</option>
                <option value="preescolar">Preescolar</option>
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
                <option value="preparatoria">Preparatoria</option>
                <option value="universidad">Universidad</option>
              </select>
            </div>
            <div class="col-md-2">
              <select class="form-control" id="filterStatus">
                <option value="">Todos</option>
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
        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Total de Estudiantes</p>
                  <h3 class="mb-0">${students?.length || 0}</h3>
                </div>
                <div class="icon-box bg-primary bg-opacity-10 text-primary">
                  <i class="bi bi-people fs-4"></i>
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
                  <p class="text-muted mb-1">Estudiantes Activos</p>
                  <h3 class="mb-0">${students?.filter(s => s.activo).length || 0}</h3>
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
                  <p class="text-muted mb-1">Nuevos Este Mes</p>
                  <h3 class="mb-0">${students?.filter(s => {
                    const createdDate = new Date(s.created_at)
                    const now = new Date()
                    return createdDate.getMonth() === now.getMonth() && 
                           createdDate.getFullYear() === now.getFullYear()
                  }).length || 0}</h3>
                </div>
                <div class="icon-box bg-info bg-opacity-10 text-info">
                  <i class="bi bi-person-plus fs-4"></i>
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
                  <p class="text-muted mb-1">Promedio General</p>
                  <h3 class="mb-0">${students?.length > 0 ? 
                    (students.reduce((sum, s) => sum + (s.promedio_general || 0), 0) / students.length).toFixed(1) : 
                    '0.0'}</h3>
                </div>
                <div class="icon-box bg-warning bg-opacity-10 text-warning">
                  <i class="bi bi-star fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabla de Estudiantes -->
      <div class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Nombre Completo</th>
                  <th>Nivel</th>
                  <th>Grado</th>
                  <th>Tutor</th>
                  <th>Teléfono</th>
                  <th>Promedio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="studentsTableBody">
                ${students && students.length > 0 ? students.map(student => `
                  <tr>
                    <td><strong>${student.matricula || 'N/A'}</strong></td>
                    <td>${student.nombre || `${student.primer_nombre || ''} ${student.apellido_paterno || ''}`}</td>
                    <td><span class="badge bg-info">${student.nivel_educativo || 'N/A'}</span></td>
                    <td>${student.grado || 'N/A'}${student.seccion ? ` - ${student.seccion}` : ''}</td>
                    <td>${student.nombre_tutor || 'No especificado'}</td>
                    <td>${student.telefono || 'N/A'}</td>
                    <td><span class="badge ${student.promedio_general >= 80 ? 'bg-success' : student.promedio_general >= 60 ? 'bg-warning' : 'bg-danger'}">${student.promedio_general || 'N/A'}</span></td>
                    <td><span class="badge ${student.activo ? 'bg-success' : 'bg-secondary'}">${student.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-1" onclick="window.viewStudent('${student.id}')">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-warning me-1" onclick="window.editStudent('${student.id}')">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" onclick="window.deleteStudent('${student.id}')">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="9" class="text-center">No hay estudiantes registrados</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Event Listeners
  document.getElementById('addStudentBtn').addEventListener('click', () => showStudentModal())
  document.getElementById('searchStudent').addEventListener('input', filterStudents)
  document.getElementById('filterLevel').addEventListener('change', filterStudents)
  document.getElementById('filterStatus').addEventListener('change', filterStudents)
  document.getElementById('clearFilters').addEventListener('click', clearFilters)
  
  // Exponer funciones globalmente
  window.viewStudent = viewStudentDetails
  window.editStudent = editStudent
  window.deleteStudent = deleteStudent
}

/**
 * Filtrar estudiantes
 */
function filterStudents() {
  const searchTerm = document.getElementById('searchStudent').value.toLowerCase()
  const levelFilter = document.getElementById('filterLevel').value
  const statusFilter = document.getElementById('filterStatus').value
  
  const rows = document.querySelectorAll('#studentsTableBody tr')
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase()
    const matchesSearch = text.includes(searchTerm)
    const matchesLevel = !levelFilter || text.includes(levelFilter)
    const matchesStatus = !statusFilter || 
      (statusFilter === 'true' && text.includes('activo')) ||
      (statusFilter === 'false' && text.includes('inactivo'))
    
    row.style.display = matchesSearch && matchesLevel && matchesStatus ? '' : 'none'
  })
}

/**
 * Limpiar filtros
 */
function clearFilters() {
  document.getElementById('searchStudent').value = ''
  document.getElementById('filterLevel').value = ''
  document.getElementById('filterStatus').value = ''
  filterStudents()
}

/**
 * Mostrar modal para crear/editar estudiante
 */
async function showStudentModal(student = null) {
  const modalHtml = `
    <div class="modal fade show" style="display: block;" tabindex="-1">
      <div class="modal-dialog modal-xl modal-dialog-scrollable" style="max-width: 95%; width: 1400px;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person${student ? '-gear' : '-plus'} me-2"></i>
              ${student ? 'Editar Estudiante' : 'Nuevo Estudiante'}
            </h5>
            <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
          </div>
          <div class="modal-body">
            <form id="studentForm">
              <!-- Información Personal -->
              <div class="mb-4">
                <h6 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-person-circle me-2"></i>
                  Información Personal
                </h6>
                <div class="row g-3">
                  <div class="col-md-2">
                    <label class="form-label">Primer Nombre *</label>
                    <input type="text" class="form-control" id="primerNombre" 
                      value="${student?.primer_nombre || ''}" required>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Segundo Nombre</label>
                    <input type="text" class="form-control" id="segundoNombre" 
                      value="${student?.segundo_nombre || ''}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Apellido Paterno *</label>
                    <input type="text" class="form-control" id="apellidoPaterno" 
                      value="${student?.apellido_paterno || ''}" required>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Apellido Materno</label>
                    <input type="text" class="form-control" id="apellidoMaterno" 
                      value="${student?.apellido_materno || ''}">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">DNI/Identidad *</label>
                    <input type="text" class="form-control" id="dni" 
                      value="${student?.dni || ''}" 
                      placeholder="0801-1990-12345" required>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Fecha de Nacimiento *</label>
                    <input type="date" class="form-control" id="fechaNacimiento" 
                      value="${student?.fecha_nacimiento || ''}" required>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Género *</label>
                    <select class="form-control" id="genero" required>
                      <option value="">Seleccionar...</option>
                      <option value="masculino" ${student?.genero === 'masculino' ? 'selected' : ''}>Masculino</option>
                      <option value="femenino" ${student?.genero === 'femenino' ? 'selected' : ''}>Femenino</option>
                      <option value="otro" ${student?.genero === 'otro' ? 'selected' : ''}>Otro</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" 
                      value="${student?.email || ''}"
                      placeholder="estudiante@ejemplo.com">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" id="telefono" 
                      value="${student?.telefono || ''}"
                      placeholder="+504 9999-9999">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Dirección</label>
                    <textarea class="form-control" id="direccion" rows="2" 
                      placeholder="Dirección completa...">${student?.direccion || ''}</textarea>
                  </div>
                </div>
              </div>

              <!-- Información Académica -->
              <div class="mb-4">
                <h6 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-mortarboard me-2"></i>
                  Información Académica
                </h6>
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label">Matrícula *</label>
                    <input type="text" class="form-control" id="matricula" 
                      value="${student?.matricula || ''}"
                      placeholder="2024-00001" required>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Nivel Educativo *</label>
                    <select class="form-control" id="nivelEducativo" required>
                      <option value="">Seleccionar...</option>
                      <option value="preescolar" ${student?.nivel_educativo === 'preescolar' ? 'selected' : ''}>Preescolar</option>
                      <option value="primaria" ${student?.nivel_educativo === 'primaria' ? 'selected' : ''}>Primaria</option>
                      <option value="secundaria" ${student?.nivel_educativo === 'secundaria' ? 'selected' : ''}>Secundaria</option>
                      <option value="preparatoria" ${student?.nivel_educativo === 'preparatoria' ? 'selected' : ''}>Preparatoria</option>
                      <option value="universidad" ${student?.nivel_educativo === 'universidad' ? 'selected' : ''}>Universidad</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Fecha de Ingreso *</label>
                    <input type="date" class="form-control" id="fechaIngreso" 
                      value="${student?.fecha_ingreso || ''}" required>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Grado *</label>
                    <input type="text" class="form-control" id="grado" 
                      value="${student?.grado || ''}"
                      placeholder="1°, 2°, 3°..." required>
                  </div>
                  <div class="col-md-1">
                    <label class="form-label">Sección</label>
                    <input type="text" class="form-control" id="seccion" 
                      value="${student?.seccion || ''}"
                      placeholder="A, B, C...">
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Promedio General</label>
                    <input type="number" class="form-control" id="promedioGeneral" 
                      value="${student?.promedio_general || ''}"
                      step="0.01" min="0" max="100"
                      placeholder="0.00">
                  </div>
                </div>
              </div>

              <!-- Información Familiar -->
              <div class="mb-4">
                <h6 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-people me-2"></i>
                  Información del Tutor
                </h6>
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Nombre del Tutor *</label>
                    <input type="text" class="form-control" id="nombreTutor" 
                      value="${student?.nombre_tutor || ''}"
                      placeholder="Nombre completo" required>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label">Relación *</label>
                    <select class="form-control" id="relacionTutor" required>
                      <option value="">Seleccionar...</option>
                      <option value="padre" ${student?.relacion_tutor === 'padre' ? 'selected' : ''}>Padre</option>
                      <option value="madre" ${student?.relacion_tutor === 'madre' ? 'selected' : ''}>Madre</option>
                      <option value="abuelo" ${student?.relacion_tutor === 'abuelo' ? 'selected' : ''}>Abuelo</option>
                      <option value="abuela" ${student?.relacion_tutor === 'abuela' ? 'selected' : ''}>Abuela</option>
                      <option value="tio" ${student?.relacion_tutor === 'tio' ? 'selected' : ''}>Tío</option>
                      <option value="tia" ${student?.relacion_tutor === 'tia' ? 'selected' : ''}>Tía</option>
                      <option value="tutor_legal" ${student?.relacion_tutor === 'tutor_legal' ? 'selected' : ''}>Tutor Legal</option>
                      <option value="otro" ${student?.relacion_tutor === 'otro' ? 'selected' : ''}>Otro</option>
                    </select>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Teléfono del Tutor *</label>
                    <input type="tel" class="form-control" id="telefonoTutor" 
                      value="${student?.telefono_tutor || ''}"
                      placeholder="+504 9999-9999" required>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Email del Tutor</label>
                    <input type="email" class="form-control" id="emailTutor" 
                      value="${student?.email_tutor || ''}"
                      placeholder="tutor@ejemplo.com">
                  </div>
                </div>
              </div>

              <!-- Información Médica -->
              <div class="mb-4">
                <h6 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-hospital me-2"></i>
                  Información Médica
                </h6>
                <div class="row g-3">
                  <div class="col-md-2">
                    <label class="form-label">Tipo de Sangre</label>
                    <select class="form-control" id="tipoSangre">
                      <option value="">Seleccionar...</option>
                      <option value="A+" ${student?.tipo_sangre === 'A+' ? 'selected' : ''}>A+</option>
                      <option value="A-" ${student?.tipo_sangre === 'A-' ? 'selected' : ''}>A-</option>
                      <option value="B+" ${student?.tipo_sangre === 'B+' ? 'selected' : ''}>B+</option>
                      <option value="B-" ${student?.tipo_sangre === 'B-' ? 'selected' : ''}>B-</option>
                      <option value="AB+" ${student?.tipo_sangre === 'AB+' ? 'selected' : ''}>AB+</option>
                      <option value="AB-" ${student?.tipo_sangre === 'AB-' ? 'selected' : ''}>AB-</option>
                      <option value="O+" ${student?.tipo_sangre === 'O+' ? 'selected' : ''}>O+</option>
                      <option value="O-" ${student?.tipo_sangre === 'O-' ? 'selected' : ''}>O-</option>
                    </select>
                  </div>
                  <div class="col-md-5">
                    <label class="form-label">Contacto de Emergencia</label>
                    <input type="text" class="form-control" id="contactoEmergencia" 
                      value="${student?.contacto_emergencia || ''}"
                      placeholder="Nombre completo">
                  </div>
                  <div class="col-md-5">
                    <label class="form-label">Teléfono de Emergencia</label>
                    <input type="tel" class="form-control" id="telefonoEmergencia" 
                      value="${student?.telefono_emergencia || ''}"
                      placeholder="+504 9999-9999">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Alergias</label>
                    <textarea class="form-control" id="alergias" rows="2" 
                      placeholder="Descripción de alergias...">${student?.alergias || ''}</textarea>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Condiciones Médicas</label>
                    <textarea class="form-control" id="condicionesMedicas" rows="2" 
                      placeholder="Condiciones médicas o enfermedades crónicas...">${student?.condiciones_medicas || ''}</textarea>
                  </div>
                </div>
              </div>

              <!-- Estado -->
              <div class="mb-3">
                <h6 class="border-bottom pb-2 mb-3">
                  <i class="bi bi-toggle-on me-2"></i>
                  Estado
                </h6>
                <div class="row g-3">
                  <div class="col-md-12">
                    <label class="form-label">Estado del Estudiante</label>
                    <select class="form-control" id="studentStatus">
                      <option value="true" ${student?.activo !== false ? 'selected' : ''}>Activo</option>
                      <option value="false" ${student?.activo === false ? 'selected' : ''}>Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
            <button type="button" class="btn btn-primary" id="saveStudent">
              <i class="bi bi-save me-2"></i>Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  document.getElementById('saveStudent').addEventListener('click', () => saveStudent(student?.id))
}

/**
 * Guarda el estudiante (crear o actualizar)
 */
async function saveStudent(studentId = null) {
  const form = document.getElementById('studentForm')
  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }
  
  // Obtener usuario actual para auditoría
  const { data: { user } } = await supabase.auth.getUser()
  
  const studentData = {
    // Información personal
    primer_nombre: document.getElementById('primerNombre')?.value,
    segundo_nombre: document.getElementById('segundoNombre')?.value || null,
    apellido_paterno: document.getElementById('apellidoPaterno')?.value,
    apellido_materno: document.getElementById('apellidoMaterno')?.value || null,
    dni: document.getElementById('dni')?.value,
    fecha_nacimiento: document.getElementById('fechaNacimiento')?.value,
    genero: document.getElementById('genero')?.value,
    email: document.getElementById('email')?.value || null,
    telefono: document.getElementById('telefono')?.value || null,
    direccion: document.getElementById('direccion')?.value || null,
    
    // Información académica
    matricula: document.getElementById('matricula')?.value,
    nivel_educativo: document.getElementById('nivelEducativo')?.value,
    grado: document.getElementById('grado')?.value,
    seccion: document.getElementById('seccion')?.value || null,
    fecha_ingreso: document.getElementById('fechaIngreso')?.value,
    promedio_general: parseFloat(document.getElementById('promedioGeneral')?.value) || null,
    
    // Información familiar
    nombre_tutor: document.getElementById('nombreTutor')?.value,
    relacion_tutor: document.getElementById('relacionTutor')?.value,
    telefono_tutor: document.getElementById('telefonoTutor')?.value,
    email_tutor: document.getElementById('emailTutor')?.value || null,
    
    // Información médica
    tipo_sangre: document.getElementById('tipoSangre')?.value || null,
    alergias: document.getElementById('alergias')?.value || null,
    condiciones_medicas: document.getElementById('condicionesMedicas')?.value || null,
    contacto_emergencia: document.getElementById('contactoEmergencia')?.value || null,
    telefono_emergencia: document.getElementById('telefonoEmergencia')?.value || null,
    
    activo: document.getElementById('studentStatus')?.value === 'true',
    rol: 'student'
  }
  
  // Construir nombre completo (campo requerido en profiles)
  studentData.nombre = [
    studentData.primer_nombre,
    studentData.segundo_nombre,
    studentData.apellido_paterno,
    studentData.apellido_materno
  ].filter(Boolean).join(' ')
  
  try {
    if (studentId) {
      // Actualizar estudiante existente
      studentData.updated_by = user?.id
      
      const { error } = await supabase
        .from('profiles')
        .update(studentData)
        .eq('id', studentId)
      
      if (error) throw error
      showSuccessNotification('Estudiante actualizado exitosamente', studentData.nombre)
    } else {
      // Crear nuevo perfil de estudiante
      studentData.id = crypto.randomUUID()
      studentData.created_by = user?.id
      
      const { error } = await supabase
        .from('profiles')
        .insert([studentData])
      
      if (error) throw error
      
      showSuccessNotification('Estudiante creado exitosamente', studentData.nombre)
    }
    
    closeModal()
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderStudentsView(mainContent)
    }
  } catch (error) {
    console.error('Error guardando estudiante:', error)
    alert('Error al guardar el estudiante: ' + error.message)
  }
}

/**
 * Ver detalles del estudiante
 */
async function viewStudentDetails(studentId) {
  const { data: student, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single()
  
  if (error || !student) {
    console.error('Error cargando detalles:', error)
    alert('No se pudo cargar la información del estudiante')
    return
  }
  
  const modalHtml = `
    <div class="modal fade show" style="display: block;" id="studentDetailsModal">
      <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-circle me-2"></i>
              Detalles del Estudiante
            </h5>
            <button type="button" class="btn-close" onclick="this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()"></button>
          </div>
          <div class="modal-body">
            <div class="row g-4">
              <!-- Información Personal -->
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-person me-2"></i>Información Personal</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Nombre Completo:</strong><br>${student.nombre}</p>
                    <p><strong>DNI:</strong> ${student.dni || 'No especificado'}</p>
                    <p><strong>Fecha de Nacimiento:</strong> ${student.fecha_nacimiento || 'No especificada'}</p>
                    <p><strong>Género:</strong> ${student.genero || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${student.email || 'No especificado'}</p>
                    <p><strong>Teléfono:</strong> ${student.telefono || 'No especificado'}</p>
                    <p><strong>Dirección:</strong><br>${student.direccion || 'No especificada'}</p>
                  </div>
                </div>
              </div>
              
              <!-- Información Académica -->
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-mortarboard me-2"></i>Información Académica</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Matrícula:</strong> ${student.matricula || 'No asignada'}</p>
                    <p><strong>Nivel Educativo:</strong> ${student.nivel_educativo || 'No especificado'}</p>
                    <p><strong>Grado:</strong> ${student.grado || 'No especificado'}</p>
                    <p><strong>Sección:</strong> ${student.seccion || 'No asignada'}</p>
                    <p><strong>Fecha de Ingreso:</strong> ${student.fecha_ingreso || 'No especificada'}</p>
                    <p><strong>Promedio General:</strong> <span class="badge ${student.promedio_general >= 80 ? 'bg-success' : student.promedio_general >= 60 ? 'bg-warning' : 'bg-danger'}">${student.promedio_general || 'N/A'}</span></p>
                  </div>
                </div>
              </div>
              
              <!-- Información del Tutor -->
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-people me-2"></i>Información del Tutor</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Nombre:</strong> ${student.nombre_tutor || 'No especificado'}</p>
                    <p><strong>Relación:</strong> ${student.relacion_tutor || 'No especificada'}</p>
                    <p><strong>Teléfono:</strong> ${student.telefono_tutor || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${student.email_tutor || 'No especificado'}</p>
                  </div>
                </div>
              </div>
              
              <!-- Información Médica -->
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0"><i class="bi bi-hospital me-2"></i>Información Médica</h6>
                  </div>
                  <div class="card-body">
                    <p><strong>Tipo de Sangre:</strong> ${student.tipo_sangre || 'No especificado'}</p>
                    <p><strong>Alergias:</strong><br>${student.alergias || 'Ninguna registrada'}</p>
                    <p><strong>Condiciones Médicas:</strong><br>${student.condiciones_medicas || 'Ninguna registrada'}</p>
                    <p><strong>Contacto de Emergencia:</strong> ${student.contacto_emergencia || 'No especificado'}</p>
                    <p><strong>Teléfono de Emergencia:</strong> ${student.telefono_emergencia || 'No especificado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()">Cerrar</button>
            <button type="button" class="btn btn-primary" onclick="window.editStudent('${student.id}'); this.closest('.modal').remove(); document.querySelector('.modal-backdrop')?.remove()">
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
 * Editar estudiante
 */
async function editStudent(studentId) {
  const { data: student, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single()
  
  if (error || !student) {
    console.error('Error cargando estudiante:', error)
    alert('No se pudo cargar la información del estudiante')
    return
  }
  
  showStudentModal(student)
}

/**
 * Eliminar estudiante
 */
async function deleteStudent(studentId) {
  if (!confirm('¿Estás seguro de eliminar este estudiante? Esta acción no se puede deshacer.')) {
    return
  }
  
  try {
    // Obtener el nombre del estudiante antes de eliminarlo
    const { data: student } = await supabase
      .from('profiles')
      .select('nombre')
      .eq('id', studentId)
      .single()
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', studentId)
    
    if (error) throw error
    
    showSuccessNotification('Estudiante eliminado exitosamente', student?.nombre || 'Estudiante')
    
    // Recargar la vista
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      renderStudentsView(mainContent)
    }
  } catch (error) {
    console.error('Error eliminando estudiante:', error)
    alert('Error al eliminar el estudiante: ' + error.message)
  }
}

/**
 * Cerrar modal
 */
function closeModal() {
  document.querySelector('.modal')?.remove()
  document.querySelector('.modal-backdrop')?.remove()
}
