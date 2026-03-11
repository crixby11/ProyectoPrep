import { logout } from '../auth/authHandler.js'
import { 
  loadUserPermissions, 
  filterSidebarByPermissions,
  validateModuleAccess,
  canCreateInModule,
  canEditInModule,
  canDeleteInModule
} from '../../utils/permissions.js'

/**
 * Renderiza el dashboard según el rol del usuario
 */
export async function renderDashboard(container, user, role) {
  const dashboards = {
    teacher: renderTeacherDashboard,
    student: renderStudentDashboard,
    parent: renderParentDashboard,
    admin: renderAdminDashboard
  }
  
  const renderFunction = dashboards[role] || renderAdminDashboard
  renderFunction(container, user)
  
  // Cargar permisos del usuario
  await loadUserPermissions(user.id)
  
  // Inicializar eventos después de renderizar
  setTimeout(() => {
    initializeLayoutEvents()
    
    // Filtrar sidebar según permisos
    const sidebar = document.getElementById('sidebar')
    if (sidebar) {
      filterSidebarByPermissions(sidebar)
    }
  }, 100)
}

/**
 * Dashboard para Administradores
 */
function renderAdminDashboard(container, user) {
  const nombreUsuario = [
    user.user_metadata?.primer_nombre,
    user.user_metadata?.apellido_paterno
  ].filter(Boolean).join(' ') || user.email.split('@')[0]
  
  container.innerHTML = `
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <h5>
            <i class="bi bi-mortarboard-fill"></i>
            Edusy
          </h5>
          <button class="sidebar-close" id="sidebarClose">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <div class="menu-section">
          <div class="menu-section-title">Principal</div>
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link active" href="#" data-view="dashboard">
                <i class="bi bi-speedometer2"></i>
                <span>Dashboard</span>
              </a>
            </li>
          </ul>
        </div>
        
        <div class="menu-section">
          <div class="menu-section-title">Académico</div>
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="courses">
                <i class="bi bi-book"></i>
                <span>Cursos</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="students">
                <i class="bi bi-people"></i>
                <span>Estudiantes</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="teachers">
                <i class="bi bi-person-badge"></i>
                <span>Maestros</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="enrollments">
                <i class="bi bi-card-checklist"></i>
                <span>Inscripciones</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="grades">
                <i class="bi bi-card-list"></i>
                <span>Calificaciones</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="attendance">
                <i class="bi bi-calendar-check"></i>
                <span>Asistencia</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="tasks">
                <i class="bi bi-list-check"></i>
                <span>Tareas</span>
              </a>
            </li>
          </ul>
        </div>
        
        <div class="menu-section">
          <div class="menu-section-title">Recursos</div>
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="resources">
                <i class="bi bi-folder"></i>
                <span>Biblioteca</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="messages">
                <i class="bi bi-chat-dots"></i>
                <span>Mensajes</span>
              </a>
            </li>
          </ul>
        </div>
        
        <div class="menu-section">
          <div class="menu-section-title">Sistema</div>
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="users">
                <i class="bi bi-person-gear"></i>
                <span>Usuarios</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#" data-view="settings">
                <i class="bi bi-gear"></i>
                <span>Configuración</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
    
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- Main Content Wrapper -->
    <div class="main-wrapper" id="mainWrapper">
      <!-- Header -->
      <nav class="navbar top-navbar">
        <div class="container-fluid d-flex align-items-center h-100">
          <button class="hamburger-menu" id="sidebarToggle">
            <i class="bi bi-list"></i>
          </button>
          
          <nav aria-label="breadcrumb" class="d-none d-lg-block ms-3">
            <ol class="breadcrumb mb-0">
              <li class="breadcrumb-item"><a href="#">Inicio</a></li>
              <li class="breadcrumb-item active">Dashboard</li>
            </ol>
          </nav>
          
          <div class="navbar-brand d-lg-none fw-bold me-auto">Edusy</div>
          <div class="flex-grow-1 d-none d-lg-block"></div>
          
          <div class="d-flex align-items-center gap-2">
            <!-- User Menu -->
            <div class="dropdown">
              <button class="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button" id="userDropdown" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle"></i>
                <span class="d-none d-md-inline">${nombreUsuario}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i> Perfil</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      
      <!-- Dashboard Content -->
      <main class="dashboard-content" id="main-content">
        <div class="container-fluid">
          <div class="mb-3">
            <h1 class="h3 font-bold">Dashboard Overview</h1>
            <p class="text-muted text-sm">Bienvenido de nuevo! Esto es lo que está pasando hoy.</p>
          </div>
          
          <!-- Stats Cards -->
          <div class="dashboard-row">
            <div class="dashboard-grid grid-cols-4">
              <div class="stats-card">
                <div class="stats-card-label">Total Estudiantes</div>
                <div class="stats-card-value">1,245</div>
                <span class="stats-card-change positive">+12%</span>
              </div>
              
              <div class="stats-card">
                <div class="stats-card-label">Cursos Activos</div>
                <div class="stats-card-value">48</div>
                <span class="stats-card-change positive">+5%</span>
              </div>
              
              <div class="stats-card">
                <div class="stats-card-label">Maestros</div>
                <div class="stats-card-value">86</div>
                <span class="stats-card-change neutral">0%</span>
              </div>
              
              <div class="stats-card">
                <div class="stats-card-label">Promedio General</div>
                <div class="stats-card-value">8.5</div>
                <span class="stats-card-change positive">+2%</span>
              </div>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="dashboard-row">
            <div class="dashboard-card">
              <div class="dashboard-card-header">
                <h5 class="dashboard-card-title">Acciones Rápidas</h5>
              </div>
              <div class="dashboard-card-body">
                <div class="quick-actions-grid">
                  <a href="#" class="quick-action-item" data-view="courses">
                    <i class="bi bi-plus-circle"></i>
                    <span>Nuevo Curso</span>
                  </a>
                  <a href="#" class="quick-action-item" data-view="students">
                    <i class="bi bi-person-plus"></i>
                    <span>Registrar Estudiante</span>
                  </a>
                  <a href="#" class="quick-action-item" data-view="grades">
                    <i class="bi bi-clipboard-check"></i>
                    <span>Capturar Calificaciones</span>
                  </a>
                  <a href="#" class="quick-action-item" data-view="attendance">
                    <i class="bi bi-calendar-check"></i>
                    <span>Tomar Asistencia</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recent Activity -->
          <div class="dashboard-row">
            <div class="dashboard-card">
              <div class="dashboard-card-header">
                <h5 class="dashboard-card-title">Actividad Reciente</h5>
              </div>
              <div class="dashboard-card-body">
                <div class="activity-list">
                  <div class="activity-item">
                    <div class="activity-icon bg-primary">
                      <i class="bi bi-person-plus"></i>
                    </div>
                    <div class="activity-content">
                      <p class="mb-0">Nuevo estudiante registrado</p>
                      <small class="text-muted">Hace 5 minutos</small>
                    </div>
                  </div>
                  <div class="activity-item">
                    <div class="activity-icon bg-success">
                      <i class="bi bi-clipboard-check"></i>
                    </div>
                    <div class="activity-content">
                      <p class="mb-0">Calificaciones capturadas - Matemáticas 101</p>
                      <small class="text-muted">Hace 1 hora</small>
                    </div>
                  </div>
                  <div class="activity-item">
                    <div class="activity-icon bg-info">
                      <i class="bi bi-calendar-check"></i>
                    </div>
                    <div class="activity-content">
                      <p class="mb-0">Asistencia tomada - Grupo A</p>
                      <small class="text-muted">Hace 2 horas</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
  
  addDashboardStyles()
  addLogoutListener()
}

/**
 * Renderiza el contenido principal del dashboard (home)
 */
function renderDashboardHome(container) {
  container.innerHTML = `
    <div class="container-fluid">
      <div class="mb-3">
        <h1 class="h3 font-bold">Dashboard Overview</h1>
        <p class="text-muted text-sm">Bienvenido de nuevo! Esto es lo que está pasando hoy.</p>
      </div>
      
      <!-- Stats Cards -->
      <div class="dashboard-row">
        <div class="dashboard-grid grid-cols-4">
          <div class="stats-card">
            <div class="stats-card-label">Total Estudiantes</div>
            <div class="stats-card-value">1,245</div>
            <span class="stats-card-change positive">+12%</span>
          </div>
          
          <div class="stats-card">
            <div class="stats-card-label">Cursos Activos</div>
            <div class="stats-card-value">48</div>
            <span class="stats-card-change positive">+5%</span>
          </div>
          
          <div class="stats-card">
            <div class="stats-card-label">Maestros</div>
            <div class="stats-card-value">86</div>
            <span class="stats-card-change neutral">0%</span>
          </div>
          
          <div class="stats-card">
            <div class="stats-card-label">Promedio General</div>
            <div class="stats-card-value">8.5</div>
            <span class="stats-card-change positive">+2%</span>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="dashboard-row">
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <h5 class="dashboard-card-title">Acciones Rápidas</h5>
          </div>
          <div class="dashboard-card-body">
            <div class="quick-actions-grid">
              <a href="#/courses" class="quick-action-item">
                <i class="bi bi-plus-circle"></i>
                <span>Nuevo Curso</span>
              </a>
              <a href="#" class="quick-action-item" data-view="students">
                <i class="bi bi-person-plus"></i>
                <span>Registrar Estudiante</span>
              </a>
              <a href="#" class="quick-action-item" data-view="grades">
                <i class="bi bi-clipboard-check"></i>
                <span>Capturar Calificaciones</span>
              </a>
              <a href="#" class="quick-action-item" data-view="attendance">
                <i class="bi bi-calendar-check"></i>
                <span>Tomar Asistencia</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="dashboard-row">
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <h5 class="dashboard-card-title">Actividad Reciente</h5>
          </div>
          <div class="dashboard-card-body">
            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-icon bg-primary">
                  <i class="bi bi-person-plus"></i>
                </div>
                <div class="activity-content">
                  <p class="mb-0">Nuevo estudiante registrado</p>
                  <small class="text-muted">Hace 5 minutos</small>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon bg-success">
                  <i class="bi bi-clipboard-check"></i>
                </div>
                <div class="activity-content">
                  <p class="mb-0">Calificaciones capturadas - Matemáticas 101</p>
                  <small class="text-muted">Hace 1 hora</small>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon bg-info">
                  <i class="bi bi-calendar-check"></i>
                </div>
                <div class="activity-content">
                  <p class="mb-0">Asistencia tomada - Grupo A</p>
                  <small class="text-muted">Hace 2 horas</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
  
  // Re-attach listeners para acciones rápidas
  setTimeout(() => {
    const quickActions = document.querySelectorAll('.quick-action-item[data-view]')
    quickActions.forEach(action => {
      action.addEventListener('click', async (e) => {
        e.preventDefault()
        const view = action.getAttribute('data-view')
        const mainContent = document.getElementById('main-content')
        
        switch (view) {
          case 'students':
            const { renderStudentsView } = await import('../../modules/students/studentsView.js')
            renderStudentsView(mainContent)
            break
          case 'grades':
            mainContent.innerHTML = '<div class="alert alert-info m-4">Módulo de calificaciones en construcción</div>'
            break
          case 'attendance':
            const { renderAttendanceView } = await import('../../modules/attendance/attendanceView.js')
            renderAttendanceView(mainContent)
            break
        }
      })
    })
  }, 100)
}

/**
 * Otros roles usan el mismo layout (simplificado por ahora)
 */
function renderTeacherDashboard(container, user) {
  renderAdminDashboard(container, user)
}

function renderStudentDashboard(container, user) {
  renderAdminDashboard(container, user)
}

function renderParentDashboard(container, user) {
  renderAdminDashboard(container, user)
}

/**
 * Inicializa eventos del layout
 */
function initializeLayoutEvents() {
  const sidebar = document.getElementById('sidebar')
  const sidebarToggle = document.getElementById('sidebarToggle')
  const sidebarClose = document.getElementById('sidebarClose')
  const sidebarOverlay = document.getElementById('sidebarOverlay')
  const navLinks = document.querySelectorAll('.nav-link')
  
  if (!sidebar || !sidebarToggle) return
  
  // Toggle sidebar
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active')
    sidebarOverlay?.classList.toggle('active')
  })
  
  // Close sidebar
  sidebarClose?.addEventListener('click', () => {
    sidebar.classList.remove('active')
    sidebarOverlay?.classList.remove('active')
  })
  
  sidebarOverlay?.addEventListener('click', () => {
    sidebar.classList.remove('active')
    sidebarOverlay.classList.remove('active')
  })
  
  // Nav links activos
  navLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault()
      const view = link.getAttribute('data-view')
      
      // Validar permisos de acceso al módulo
      try {
        if (view !== 'dashboard') {
          validateModuleAccess(view)
        }
      } catch (error) {
        alert(error.message)
        return
      }
      
      // Actualizar nav activo
      navLinks.forEach(l => l.classList.remove('active'))
      link.classList.add('active')
      
      // Cargar la vista correspondiente
      const mainContent = document.getElementById('main-content')
      if (!mainContent) return
      
      // Mostrar loading
      mainContent.innerHTML = `
        <div class="container-fluid">
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      `
      
      try {
        switch (view) {
          case 'dashboard':
            renderDashboardHome(mainContent)
            window.location.hash = '' // Limpiar hash
            break
          case 'courses':
            const { renderCoursesView } = await import('../../modules/courses/coursesView.js')
            renderCoursesView(mainContent)
            break
          case 'teachers':
            const { renderTeachersView } = await import('../../modules/teachers/teachersView.js')
            renderTeachersView(mainContent)
            break
          case 'students':
            const { renderStudentsView } = await import('../../modules/students/studentsView.js')
            renderStudentsView(mainContent)
            break
          case 'enrollments':
            const { renderEnrollmentsView } = await import('../../modules/enrollments/enrollmentsView.js')
            renderEnrollmentsView(mainContent)
            break
          case 'attendance':
            const { renderAttendanceView } = await import('../../modules/attendance/attendanceView.js')
            renderAttendanceView(mainContent)
            break
          case 'users':
            const { renderUsersView } = await import('../../modules/users/usersView.js')
            renderUsersView(mainContent)
            break
          case 'settings':
            const { renderSettingsView } = await import('../../modules/settings/settingsView.js')
            renderSettingsView(mainContent)
            break
          default:
            mainContent.innerHTML = `
              <div class="container-fluid">
                <div class="text-center py-5">
                  <i class="bi bi-wrench" style="font-size: 4rem; color: #6b7280;"></i>
                  <h3 class="mt-3">Módulo en Construcción</h3>
                  <p class="text-muted">El módulo "${link.textContent.trim()}" estará disponible pronto.</p>
                </div>
              </div>
            `
        }
      } catch (error) {
        console.error('Error cargando módulo:', error)
        mainContent.innerHTML = `
          <div class="container-fluid">
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Error al cargar el módulo: ${error.message}
            </div>
          </div>
        `
      }
      
      // Cerrar sidebar en móvil
      if (window.innerWidth < 992) {
        sidebar.classList.remove('active')
        sidebarOverlay?.classList.remove('active')
      }
    })
  })
  
  // Agregar soporte para hash routing (para rutas parametrizadas como #/course/123)
  initializeHashRouting()
}

/**
 * Inicializa el sistema de routing basado en hash para rutas parametrizadas
 */
function initializeHashRouting() {
  // Manejar cambios en el hash
  window.addEventListener('hashchange', handleHashRoute)
  
  // Manejar ruta inicial si existe
  if (window.location.hash) {
    handleHashRoute()
  }
}

/**
 * Maneja las rutas basadas en hash
 */
async function handleHashRoute() {
  const hash = window.location.hash.slice(1) // Quitar el #
  
  if (!hash || hash === '/' || hash === '') {
    // Sin hash, mostrar dashboard home
    const mainContent = document.getElementById('main-content')
    if (mainContent && !mainContent.querySelector('.dashboard-row')) {
      renderDashboardHome(mainContent)
    }
    return
  }
  
  const mainContent = document.getElementById('main-content')
  if (!mainContent) return
  
  // Parsear ruta con parámetros: /course/123
  const parts = hash.split('/')
  const route = parts[1] // El primer elemento después del /
  
  switch (route) {
    case 'course':
      const sectionId = parts[2]
      if (sectionId) {
        const { renderCourseDetailView } = await import('../../modules/courses/courseDetailView.js')
        renderCourseDetailView(mainContent, sectionId)
      }
      break
    case 'courses':
      const { renderCoursesView } = await import('../../modules/courses/coursesView.js')
      renderCoursesView(mainContent)
      break
    default:
      // Ruta no reconocida, mostrar dashboard
      console.log('Ruta no reconocida:', hash)
      renderDashboardHome(mainContent)
  }
}

/**
 * Agregar listener de logout
 */
function addLogoutListener() {
  setTimeout(() => {
    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault()
        if (confirm('¿Estás seguro de cerrar sesión?')) {
          await logout()
        }
      })
    }
  }, 100)
}

/**
 * Agregar estilos del dashboard
 */
function addDashboardStyles() {
  if (document.getElementById('dashboard-styles')) return
  
  const link = document.createElement('link')
  link.id = 'dashboard-styles'
  link.rel = 'stylesheet'
  link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css'
  document.head.appendChild(link)
  
  const style = document.createElement('style')
  style.id = 'dashboard-custom-styles'
  style.textContent = `
    /* Importar estilos de kiaalap */
    @import url('../src/css/dashboard.css');
    
    :root {
      --sidebar-width: 220px;
      --header-height: 60px;
      --sidebar-bg: #1e293b;
      --body-bg: #f5f7fa;
      --border-color: #e5e7eb;
      --text-muted: #6b7280;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
      --transition-speed: 0.3s;
      --border-radius: 8px;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background: var(--body-bg);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-x: hidden;
    }
    
    /* Sidebar */
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--sidebar-bg);
      z-index: 1040;
      transition: transform var(--transition-speed) ease;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .sidebar-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
    }
    
    .sidebar-brand h5 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
    }
    
    .sidebar-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.25rem;
      display: none;
    }
    
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    
    .sidebar-nav::-webkit-scrollbar {
      width: 6px;
    }
    
    .sidebar-nav::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
    }
    
    .sidebar-nav::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
    }
    
    .menu-section {
      margin-bottom: 1.5rem;
    }
    
    .menu-section-title {
      color: rgba(255,255,255,0.4);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      padding: 0 0.75rem;
    }
    
    .nav-link {
      color: rgba(255,255,255,0.6);
      padding: 0.625rem 0.75rem;
      border-radius: var(--border-radius);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    
    .nav-link:hover {
      background: rgba(255,255,255,0.05);
      color: white;
    }
    
    .nav-link.active {
      background: #6366f1;
      color: white;
    }
    
    .nav-link i {
      font-size: 1.125rem;
      width: 20px;
      text-align: center;
    }
    
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1039;
      display: none;
    }
    
    .sidebar-overlay.active {
      display: block;
    }
    
    /* Main Wrapper */
    .main-wrapper {
      margin-left: var(--sidebar-width);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      transition: margin-left var(--transition-speed) ease;
    }
    
    /* Top Navbar */
    .top-navbar {
      background: white;
      height: var(--header-height);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 1030;
    }
    
    .hamburger-menu {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #333;
      display: none;
    }
    
    .breadcrumb {
      background: none;
      padding: 0;
      margin: 0;
    }
    
    .breadcrumb-item {
      font-size: 0.875rem;
    }
    
    .breadcrumb-item a {
      color: #6366f1;
      text-decoration: none;
    }
    
    .breadcrumb-item.active {
      color: var(--text-muted);
    }
    
    /* Dashboard Content */
    .dashboard-content {
      flex: 1;
      padding: 2rem;
    }
    
    .dashboard-row {
      margin-bottom: 1.5rem;
    }
    
    .dashboard-grid {
      display: grid;
      gap: 1.5rem;
    }
    
    .grid-cols-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    
    /* Stats Card */
    .stats-card {
      background: white;
      padding: 1.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
    }
    
    .stats-card-label {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    
    .stats-card-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    
    .stats-card-change {
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .stats-card-change.positive {
      color: #10b981;
    }
    
    .stats-card-change.neutral {
      color: var(--text-muted);
    }
    
    /* Dashboard Card */
    .dashboard-card {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
    }
    
    .dashboard-card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .dashboard-card-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }
    
    .dashboard-card-body {
      padding: 1.5rem;
    }
    
    /* Quick Actions */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    
    .quick-action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem 1rem;
      background: #f8fafc;
      border-radius: var(--border-radius);
      text-decoration: none;
      color: #1e293b;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color);
    }
    
    .quick-action-item:hover {
      background: #6366f1;
      color: white;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .quick-action-item i {
      font-size: 2rem;
    }
    
    .quick-action-item span {
      font-size: 0.875rem;
      font-weight: 500;
      text-align: center;
    }
    
    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .activity-item {
      display: flex;
      gap: 1rem;
      align-items: start;
    }
    
    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }
    
    .activity-icon.bg-primary {
      background: #6366f1;
    }
    
    .activity-icon.bg-success {
      background: #10b981;
    }
    
    .activity-icon.bg-info {
      background: #06b6d4;
    }
    
    .activity-content p {
      color: #1e293b;
      font-weight: 500;
    }
    
    .activity-content small {
      color: var(--text-muted);
    }
    
    /* Responsive */
    @media (max-width: 992px) {
      .sidebar {
        transform: translateX(-100%);
      }
      
      .sidebar.active {
        transform: translateX(0);
      }
      
      .sidebar-close {
        display: block;
      }
      
      .hamburger-menu {
        display: block;
      }
      
      .main-wrapper {
        margin-left: 0;
      }
      
      .grid-cols-4 {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .quick-actions-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 576px) {
      .grid-cols-4,
      .quick-actions-grid {
        grid-template-columns: 1fr;
      }
      
      .dashboard-content {
        padding: 1rem;
      }
    }
    
    /* Bootstrap utilities */
    .container-fluid {
      width: 100%;
      padding-right: 15px;
      padding-left: 15px;
      margin-right: auto;
      margin-left: auto;
    }
    
    .d-flex {
      display: flex !important;
    }
    
    .align-items-center {
      align-items: center !important;
    }
    
    .gap-2 {
      gap: 0.5rem !important;
    }
    
    .h-100 {
      height: 100% !important;
    }
    
    .d-none {
      display: none !important;
    }
    
    .d-lg-block {
      display: block !important;
    }
    
    .d-md-inline {
      display: inline !important;
    }
    
    .me-2 {
      margin-right: 0.5rem !important;
    }
    
    .me-auto {
      margin-right: auto !important;
    }
    
    .ms-3 {
      margin-left: 1rem !important;
    }
    
    .mb-0 {
      margin-bottom: 0 !important;
    }
    
    .mb-3 {
      margin-bottom: 1rem !important;
    }
    
    .flex-grow-1 {
      flex-grow: 1 !important;
    }
    
    .flex-column {
      flex-direction: column !important;
    }
    
    .h3 {
      font-size: 1.75rem;
    }
    
    .font-bold {
      font-weight: 700;
    }
    
    .text-muted {
      color: var(--text-muted) !important;
    }
    
    .text-sm {
      font-size: 0.875rem;
    }
    
    .fw-bold {
      font-weight: 700 !important;
    }
    
    .btn {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 400;
      line-height: 1.5;
      text-align: center;
      text-decoration: none;
      vertical-align: middle;
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      transition: all 0.15s ease-in-out;
    }
    
    .btn-light {
      background-color: #f8f9fa;
      border-color: var(--border-color);
      color: #212529;
    }
    
    .btn-light:hover {
      background-color: #e2e6ea;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
    
    .dropdown {
      position: relative;
    }
    
    .dropdown-toggle::after {
      display: inline-block;
      margin-left: 0.255em;
      vertical-align: 0.255em;
      content: "";
      border-top: 0.3em solid;
      border-right: 0.3em solid transparent;
      border-bottom: 0;
      border-left: 0.3em solid transparent;
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 1000;
      display: none;
      min-width: 10rem;
      padding: 0.5rem 0;
      margin: 0.125rem 0 0;
      font-size: 0.875rem;
      color: #212529;
      background-color: #fff;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
    }
    
    .dropdown-menu-end {
      right: 0;
      left: auto;
    }
    
    .dropdown-item {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      clear: both;
      font-weight: 400;
      color: #212529;
      text-align: inherit;
      text-decoration: none;
      white-space: nowrap;
      background-color: transparent;
      border: 0;
      cursor: pointer;
    }
    
    .dropdown-item:hover {
      background-color: #f8f9fa;
    }
    
    .dropdown-divider {
      height: 0;
      margin: 0.5rem 0;
      overflow: hidden;
      border-top: 1px solid var(--border-color);
    }
    
    /* Simple dropdown toggle with JavaScript */
    .dropdown:hover .dropdown-menu,
    .dropdown-menu:hover {
      display: block;
    }
    
    @media (min-width: 576px) {
      .d-md-inline {
        display: inline !important;
      }
    }
    
    @media (min-width: 992px) {
      .d-lg-none {
        display: none !important;
      }
      
      .d-lg-block {
        display: block !important;
      }
    }
    
    /* Additional Styles for Tables and Forms */
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table th,
    .table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    
    .table thead th {
      font-weight: 600;
      color: #1e293b;
      background: #f8fafc;
      border-bottom: 2px solid var(--border-color);
    }
    
    .table-hover tbody tr:hover {
      background-color: #f8fafc;
    }
    
    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .text-end {
      text-align: right !important;
    }
    
    .text-center {
      text-align: center !important;
    }
    
    .text-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .text-capitalize {
      text-transform: capitalize;
    }
    
    .form-control {
      display: block;
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #212529;
      background-color: #fff;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    
    .form-control:focus {
      border-color: #6366f1;
      outline: 0;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    .form-label {
      display: inline-block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #1e293b;
      font-size: 0.875rem;
    }
    
    .row {
      display: flex;
      flex-wrap: wrap;
      margin-right: -12px;
      margin-left: -12px;
    }
    
    .col-12 {
      flex: 0 0 100%;
      max-width: 100%;
      padding-right: 12px;
      padding-left: 12px;
    }
    
    .col-md-2 {
      flex: 0 0 16.666667%;
      max-width: 16.666667%;
      padding-right: 12px;
      padding-left: 12px;
    }
    
    .col-md-3 {
      flex: 0 0 25%;
      max-width: 25%;
      padding-right: 12px;
      padding-left: 12px;
    }
    
    .col-md-4 {
      flex: 0 0 33.333333%;
      max-width: 33.333333%;
      padding-right: 12px;
      padding-left: 12px;
    }
    
    .col-md-6 {
      flex: 0 0 50%;
      max-width: 50%;
      padding-right: 12px;
      padding-left: 12px;
    }
    
    .g-3 {
      --bs-gutter-y: 1rem;
      --bs-gutter-x: 1rem;
      margin-top: calc(-1 * var(--bs-gutter-y));
      margin-right: calc(-.5 * var(--bs-gutter-x));
      margin-left: calc(-.5 * var(--bs-gutter-x));
    }
    
    .g-3 > * {
      padding-right: calc(var(--bs-gutter-x) * .5);
      padding-left: calc(var(--bs-gutter-x) * .5);
      margin-top: var(--bs-gutter-y);
    }
    
    .justify-content-between {
      justify-content: space-between !important;
    }
    
    .mb-1 {
      margin-bottom: 0.25rem !important;
    }
    
    .mb-4 {
      margin-bottom: 1.5rem !important;
    }
    
    .btn-primary {
      background-color: #6366f1;
      border-color: #6366f1;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #4f46e5;
      border-color: #4f46e5;
    }
    
    .btn-secondary {
      background-color: #6b7280;
      border-color: #6b7280;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #4b5563;
    }
    
    .btn-group {
      display: inline-flex;
    }
    
    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    
    .badge {
      display: inline-block;
      padding: 0.35em 0.65em;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1;
      color: #fff;
      text-align: center;
      white-space: nowrap;
      vertical-align: baseline;
      border-radius: 0.25rem;
    }
    
    .bg-success {
      background-color: #10b981 !important;
    }
    
    .bg-secondary {
      background-color: #6b7280 !important;
    }
    
    .bg-info {
      background-color: #06b6d4 !important;
    }
    
    .bg-warning {
      background-color: #f59e0b !important;
    }
    
    .bg-danger {
      background-color: #ef4444 !important;
    }
    
    .w-100 {
      width: 100% !important;
    }
    
    .py-4 {
      padding-top: 1.5rem !important;
      padding-bottom: 1.5rem !important;
    }
    
    .py-5 {
      padding-top: 3rem !important;
      padding-bottom: 3rem !important;
    }
    
    .p-0 {
      padding: 0 !important;
    }
    
    .mt-3 {
      margin-top: 1rem !important;
    }
    
    .small {
      font-size: 0.875rem;
    }
    
    /* Modal Styles */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1055;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      outline: 0;
    }
    
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1050;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
    }
    
    .modal-backdrop.show {
      opacity: 1;
    }
    
    .modal-dialog {
      position: relative;
      width: auto;
      margin: 1.75rem auto;
      pointer-events: none;
      max-width: 500px;
    }
    
    .modal-lg {
      max-width: 800px;
    }
    
    .modal-content {
      position: relative;
      display: flex;
      flex-direction: column;
      width: 100%;
      pointer-events: auto;
      background-color: #fff;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
    }
    
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .modal-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
    }
    
    .modal-body {
      position: relative;
      flex: 1 1 auto;
      padding: 1.5rem;
    }
    
    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    
    .btn-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0;
      color: #6b7280;
      opacity: 0.5;
    }
    
    .btn-close:hover {
      opacity: 1;
    }
    
    .btn-close::before {
      content: "×";
      font-size: 2rem;
      line-height: 1;
    }
    
    @media (max-width: 768px) {
      .col-md-2,
      .col-md-3,
      .col-md-4,
      .col-md-6 {
        flex: 0 0 100%;
        max-width: 100%;
      }
      
      .modal-dialog {
        margin: 0.5rem;
      }
    }
  `
  document.head.appendChild(style)
}
