import { supabase } from '../../lib/supabaseClient.js'

/**
 * Renderiza la vista de configuración del sistema
 */
export async function renderSettingsView(container) {
  container.innerHTML = `
    <div class="container-fluid">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="h3 mb-1">Configuración del Sistema</h1>
        <p class="text-muted mb-0">Administra los ajustes generales y permisos de acceso</p>
      </div>

      <!-- Settings Tabs -->
      <ul class="nav nav-tabs mb-4" id="settingsTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="modules-tab" data-bs-toggle="tab" 
                  data-bs-target="#modules-panel" type="button" role="tab">
            <i class="bi bi-grid-3x3-gap me-2"></i>Acceso a Módulos
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="general-tab" data-bs-toggle="tab" 
                  data-bs-target="#general-panel" type="button" role="tab">
            <i class="bi bi-gear me-2"></i>General
          </button>
        </li>
      </ul>

      <!-- Tabs Content -->
      <div class="tab-content" id="settingsTabsContent">
        <!-- Módulos Panel -->
        <div class="tab-pane fade show active" id="modules-panel" role="tabpanel">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0"><i class="bi bi-shield-lock me-2"></i>Control de Acceso a Módulos por Rol</h5>
            </div>
            <div class="card-body">
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Instrucción:</strong> Selecciona qué módulos del sistema pueden ver los docentes y estudiantes.
                Los cambios se guardan automáticamente.
              </div>

              <div id="modules-settings-content">
                <div class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando configuración...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- General Panel -->
        <div class="tab-pane fade" id="general-panel" role="tabpanel">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-gear me-2"></i>Configuración General</h5>
            </div>
            <div class="card-body">
              <p class="text-muted">Configuración general del sistema próximamente...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  // Cargar configuración de módulos
  loadModulesSettings()
}

/**
 * Cargar configuración de módulos
 */
async function loadModulesSettings() {
  const container = document.getElementById('modules-settings-content')
  if (!container) return

  try {
    // Obtener permisos actuales
    const { data: permissions, error } = await supabase
      .from('role_permissions')
      .select('*')
      .in('rol', ['teacher', 'student'])
      .order('rol', 'module')

    if (error) throw error

    // Definir módulos disponibles
    const modules = [
      { 
        id: 'dashboard', 
        name: 'Dashboard', 
        icon: 'bi-speedometer2',
        description: 'Página principal con estadísticas y resumen'
      },
      { 
        id: 'courses', 
        name: 'Cursos', 
        icon: 'bi-book',
        description: 'Gestión y visualización de cursos'
      },
      { 
        id: 'students', 
        name: 'Estudiantes', 
        icon: 'bi-people',
        description: 'Listado y perfiles de estudiantes'
      },
      { 
        id: 'teachers', 
        name: 'Maestros', 
        icon: 'bi-person-badge',
        description: 'Listado y perfiles de maestros'
      },
      { 
        id: 'enrollments', 
        name: 'Inscripciones', 
        icon: 'bi-card-checklist',
        description: 'Gestión de inscripciones a cursos'
      },
      { 
        id: 'grades', 
        name: 'Calificaciones', 
        icon: 'bi-card-list',
        description: 'Calificaciones y evaluaciones'
      },
      { 
        id: 'attendance', 
        name: 'Asistencia', 
        icon: 'bi-calendar-check',
        description: 'Control de asistencia'
      },
      { 
        id: 'tasks', 
        name: 'Tareas', 
        icon: 'bi-list-check',
        description: 'Asignaciones y tareas'
      },
      { 
        id: 'resources', 
        name: 'Biblioteca', 
        icon: 'bi-folder',
        description: 'Recursos y materiales educativos'
      },
      { 
        id: 'messages', 
        name: 'Mensajes', 
        icon: 'bi-chat-dots',
        description: 'Mensajería interna'
      }
    ]

    // Crear mapa de permisos
    const permissionsMap = {}
    permissions.forEach(p => {
      const key = `${p.rol}_${p.module}`
      permissionsMap[key] = p
    })

    container.innerHTML = `
      <div class="row">
        <!-- DOCENTES -->
        <div class="col-lg-6 mb-4">
          <div class="card border-primary">
            <div class="card-header bg-primary bg-opacity-10">
              <h5 class="mb-0">
                <i class="bi bi-person-badge text-primary me-2"></i>
                Docentes
              </h5>
            </div>
            <div class="card-body">
              <p class="text-muted mb-3">Selecciona los módulos que los docentes pueden ver:</p>
              
              <div class="list-group">
                ${modules.map(module => {
                  const key = `teacher_${module.id}`
                  const perm = permissionsMap[key]
                  const canView = perm?.can_view || false
                  
                  return `
                    <div class="list-group-item">
                      <div class="form-check">
                        <input 
                          class="form-check-input module-checkbox" 
                          type="checkbox" 
                          id="teacher_${module.id}"
                          data-role="teacher"
                          data-module="${module.id}"
                          ${canView ? 'checked' : ''}
                        >
                        <label class="form-check-label w-100" for="teacher_${module.id}">
                          <div class="d-flex align-items-start">
                            <i class="bi ${module.icon} me-2 mt-1" style="font-size: 1.2rem;"></i>
                            <div class="flex-grow-1">
                              <div class="fw-bold">${module.name}</div>
                              <small class="text-muted">${module.description}</small>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- ESTUDIANTES -->
        <div class="col-lg-6 mb-4">
          <div class="card border-info">
            <div class="card-header bg-info bg-opacity-10">
              <h5 class="mb-0">
                <i class="bi bi-people text-info me-2"></i>
                Estudiantes
              </h5>
            </div>
            <div class="card-body">
              <p class="text-muted mb-3">Selecciona los módulos que los estudiantes pueden ver:</p>
              
              <div class="list-group">
                ${modules.map(module => {
                  const key = `student_${module.id}`
                  const perm = permissionsMap[key]
                  const canView = perm?.can_view || false
                  
                  return `
                    <div class="list-group-item">
                      <div class="form-check">
                        <input 
                          class="form-check-input module-checkbox" 
                          type="checkbox" 
                          id="student_${module.id}"
                          data-role="student"
                          data-module="${module.id}"
                          ${canView ? 'checked' : ''}
                        >
                        <label class="form-check-label w-100" for="student_${module.id}">
                          <div class="d-flex align-items-start">
                            <i class="bi ${module.icon} me-2 mt-1" style="font-size: 1.2rem;"></i>
                            <div class="flex-grow-1">
                              <div class="fw-bold">${module.name}</div>
                              <small class="text-muted">${module.description}</small>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="alert alert-success mt-3">
        <i class="bi bi-check-circle me-2"></i>
        Los cambios se guardan automáticamente al marcar/desmarcar las casillas.
      </div>
    `

    // Agregar event listeners
    document.querySelectorAll('.module-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const role = e.target.dataset.role
        const module = e.target.dataset.module
        const canView = e.target.checked

        // Mostrar feedback visual
        e.target.disabled = true
        
        try {
          await updateModulePermission(role, module, canView)
          
          // Feedback exitoso
          const label = e.target.closest('.list-group-item')
          label.classList.add('bg-success', 'bg-opacity-10')
          setTimeout(() => {
            label.classList.remove('bg-success', 'bg-opacity-10')
          }, 500)
          
        } catch (error) {
          console.error('Error guardando permiso:', error)
          // Revertir checkbox
          e.target.checked = !canView
          alert('Error al guardar: ' + error.message)
        } finally {
          e.target.disabled = false
        }
      })
    })

  } catch (error) {
    console.error('Error cargando configuración:', error)
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar configuración: ${error.message}
      </div>
    `
  }
}

/**
 * Actualizar permiso de módulo
 */
async function updateModulePermission(role, module, canView) {
  try {
    // Verificar si existe el permiso
    const { data: existing, error: fetchError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('rol', role)
      .eq('module', module)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (existing) {
      // Actualizar permiso existente
      const { error: updateError } = await supabase
        .from('role_permissions')
        .update({ 
          can_view: canView,
          updated_at: new Date().toISOString()
        })
        .eq('rol', role)
        .eq('module', module)

      if (updateError) throw updateError
    } else {
      // Crear nuevo permiso
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert({
          rol: role,
          module: module,
          can_view: canView,
          can_create: false,
          can_edit: false,
          can_delete: false
        })

      if (insertError) throw insertError
    }

    console.log(`✓ Permiso actualizado: ${role} → ${module} = ${canView}`)
    
  } catch (error) {
    console.error('Error actualizando permiso:', error)
    throw error
  }
}
