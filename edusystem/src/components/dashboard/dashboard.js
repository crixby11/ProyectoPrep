import { logout } from '../auth/authHandler.js'
import { supabase } from '../../lib/supabaseClient.js'
import { renderUsersView } from '../../modules/users/usersView.js'
import { renderCoursesView } from '../../modules/courses/coursesView.js'
import {
  canViewModule,
  loadUserPermissions,
  getCurrentRole
} from '../../utils/permissions.js'
import {
  getTeacherPortalModules,
  renderTeacherPortalView
} from '../../portals/docentes/teacherPortal.js'
import {
  getStudentPortalModules,
  renderStudentPortalView
} from '../../portals/estudiantes/studentPortal.js'

export async function renderDashboard(container, user, role) {
  if (!container) {
    console.error('❌ Error: Container es null en renderDashboard')
    return
  }
  
  await loadUserPermissions(user.id, role)

  const resolvedRole = getCurrentRole() || role || 'student'
  const portal = buildPortalConfig(resolvedRole, user)

  renderPortalShell(container, user, portal)
  initializePortalEvents(container, user, portal)
  addLogoutListener()
  addDashboardStyles()

  await openModule(portal.defaultModule, user, portal)
}

function buildPortalConfig(role, user) {
  const roleMap = {
    admin: {
      title: 'Portal Administrativo',
      subtitle: 'Control de usuarios, permisos, cursos y datos generales',
      modules: getAdminPortalModules(),
      defaultModule: 'dashboard'
    },
    teacher: {
      title: 'Portal de Docentes',
      subtitle: 'Gestión académica diaria por grupo',
      modules: getTeacherPortalModules(),
      defaultModule: 'dashboard'
    },
    student: {
      title: 'Portal de Estudiantes',
      subtitle: 'Seguimiento académico y progreso personal',
      modules: getStudentPortalModules(),
      defaultModule: 'dashboard'
    },
    parent: {
      title: 'Portal de Estudiantes',
      subtitle: 'Seguimiento académico y progreso personal',
      modules: getStudentPortalModules(),
      defaultModule: 'dashboard'
    }
  }

  const selected = roleMap[role] || roleMap.student
  const visibleModules = selected.modules.filter(module => canViewModule(module.id))

  return {
    ...selected,
    role,
    modules: visibleModules.length ? visibleModules : [selected.modules[0]],
    userName: buildDisplayName(user)
  }
}

function getAdminPortalModules() {
  return [
    {
      id: 'dashboard',
      label: 'Datos Generales',
      icon: 'bi-bar-chart-line-fill',
      description: 'Indicadores institucionales'
    },
    {
      id: 'users',
      label: 'Usuarios y Permisos',
      icon: 'bi-people-fill',
      description: 'Alta de usuarios y roles'
    },
    {
      id: 'courses',
      label: 'Cursos',
      icon: 'bi-journal-plus',
      description: 'Creación y configuración de cursos'
    }
  ]
}

function renderPortalShell(container, user, portal) {
  const navItems = portal.modules.map((module, index) => `
    <button class="portal-nav-item ${index === 0 ? 'active' : ''}" data-view="${module.id}">
      <i class="bi ${module.icon}"></i>
      <span>${module.label}</span>
      <small>${module.description}</small>
    </button>
  `).join('')

  container.innerHTML = `
    <div class="portal-shell">
      <aside class="portal-sidebar" id="portalSidebar">
        <div class="portal-brand">
          <div class="portal-brand-mark">ED</div>
          <div>
            <h1>EduSystem</h1>
            <p>${portal.title}</p>
          </div>
        </div>

        <nav class="portal-nav">${navItems}</nav>

        <div class="portal-sidebar-footer">
          <small>Sesión activa</small>
          <strong>${portal.userName}</strong>
          <button class="btn btn-outline-light btn-sm mt-2" id="logoutBtn" type="button">
            <i class="bi bi-box-arrow-right me-1"></i>Salir
          </button>
        </div>
      </aside>

      <div class="portal-main">
        <header class="portal-topbar">
          <div class="d-flex align-items-center gap-2">
            <button class="portal-menu-btn" id="sidebarToggle" type="button">
              <i class="bi bi-list"></i>
            </button>
            <div>
              <h2>${portal.title}</h2>
              <p>${portal.subtitle}</p>
            </div>
          </div>

          <div class="portal-user-pill">
            <span>${portal.userName}</span>
            <small>${user.email}</small>
          </div>
        </header>

        <main class="portal-content" id="main-content"></main>
      </div>
    </div>

    <div class="portal-overlay" id="portalOverlay"></div>
  `
}

function initializePortalEvents(container, user, portal) {
  const sidebar = container.querySelector('#portalSidebar')
  const overlay = container.querySelector('#portalOverlay')
  const toggleBtn = container.querySelector('#sidebarToggle')
  const navButtons = Array.from(container.querySelectorAll('.portal-nav-item[data-view]'))

  toggleBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open')
    overlay?.classList.toggle('open')
  })

  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open')
    overlay?.classList.remove('open')
  })

  navButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const moduleId = button.dataset.view

      if (!canViewModule(moduleId)) {
        alert('No tienes permisos para acceder a este módulo.')
        return
      }

      navButtons.forEach(item => item.classList.remove('active'))
      button.classList.add('active')

      await openModule(moduleId, user, portal)

      if (window.innerWidth < 992) {
        sidebar?.classList.remove('open')
        overlay?.classList.remove('open')
      }
    })
  })

  // Botones dinámicos de vistas internas (docente/estudiante)
  container.addEventListener('click', async event => {
    const teacherTarget = event.target.closest('[data-teacher-view]')
    const studentTarget = event.target.closest('[data-student-view]')

    if (teacherTarget) {
      const moduleId = teacherTarget.dataset.teacherView
      await activateModuleFromShortcut(moduleId, navButtons, user, portal)
    }

    if (studentTarget) {
      const moduleId = studentTarget.dataset.studentView
      await activateModuleFromShortcut(moduleId, navButtons, user, portal)
    }
  })
}

async function activateModuleFromShortcut(moduleId, navButtons, user, portal) {
  if (!canViewModule(moduleId)) return

  navButtons.forEach(item => {
    item.classList.toggle('active', item.dataset.view === moduleId)
  })

  await openModule(moduleId, user, portal)
}

async function openModule(moduleId, user, portal) {
  const mainContent = document.getElementById('main-content')
  if (!mainContent) return

  mainContent.innerHTML = `
    <div class="portal-loading">
      <div class="spinner-border text-primary" role="status"></div>
      <p>Cargando módulo...</p>
    </div>
  `

  try {
    if (portal.role === 'admin') {
      await renderAdminPortalView(mainContent, moduleId)
      return
    }

    if (portal.role === 'teacher') {
      await renderTeacherPortalView(mainContent, moduleId, user)
      return
    }

    await renderStudentPortalView(mainContent, moduleId, user)
  } catch (error) {
    console.error('Error cargando módulo:', error)
    mainContent.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Error al cargar módulo: ${error.message}
      </div>
    `
  }
}

async function renderAdminPortalView(container, moduleId) {
  switch (moduleId) {
    case 'dashboard':
      await renderAdminHome(container)
      break
    case 'users':
      await renderUsersView(container)
      break
    case 'courses':
      await renderCoursesView(container)
      break
    default:
      container.innerHTML = '<div class="alert alert-warning">Módulo administrativo no disponible.</div>'
  }
}

async function renderAdminHome(container) {
  const [profilesResult, coursesResult, enrollmentsResult] = await Promise.all([
    supabase.from('profiles').select('id, rol, activo'),
    supabase.from('courses').select('id, activo'),
    supabase.from('enrollments').select('id, status')
  ])

  if (profilesResult.error || coursesResult.error || enrollmentsResult.error) {
    const message = profilesResult.error?.message || coursesResult.error?.message || enrollmentsResult.error?.message
    container.innerHTML = `<div class="alert alert-danger">No fue posible cargar datos generales: ${message}</div>`
    return
  }

  const profiles = profilesResult.data || []
  const courses = coursesResult.data || []
  const enrollments = enrollmentsResult.data || []

  const adminCount = profiles.filter(item => item.rol === 'admin' && item.activo).length
  const teacherCount = profiles.filter(item => item.rol === 'teacher' && item.activo).length
  const studentCount = profiles.filter(item => item.rol === 'student' && item.activo).length
  const activeCourses = courses.filter(item => item.activo).length
  const activeEnrollments = enrollments.filter(item => item.status === 'enrolled').length

  container.innerHTML = `
    <section class="portal-hero portal-hero-admin">
      <div>
        <h2>Datos Generales</h2>
        <p>Monitoreo general de la operación académica institucional.</p>
      </div>
      <div class="portal-hero-chip">
        <i class="bi bi-shield-check"></i>
        <span>Acceso Administrativo</span>
      </div>
    </section>

    <section class="portal-grid portal-grid-3">
      <article class="portal-card metric">
        <small>Usuarios activos</small>
        <h3>${adminCount + teacherCount + studentCount}</h3>
      </article>
      <article class="portal-card metric">
        <small>Cursos activos</small>
        <h3>${activeCourses}</h3>
      </article>
      <article class="portal-card metric">
        <small>Inscripciones vigentes</small>
        <h3>${activeEnrollments}</h3>
      </article>
    </section>

    <section class="portal-grid portal-grid-3">
      <article class="portal-card">
        <h4>Administradores activos</h4>
        <p class="portal-big-number">${adminCount}</p>
      </article>
      <article class="portal-card">
        <h4>Docentes activos</h4>
        <p class="portal-big-number">${teacherCount}</p>
      </article>
      <article class="portal-card">
        <h4>Estudiantes activos</h4>
        <p class="portal-big-number">${studentCount}</p>
      </article>
    </section>
  `
}

function addLogoutListener() {
  const logoutBtn = document.getElementById('logoutBtn')
  if (!logoutBtn) return

  logoutBtn.addEventListener('click', async () => {
    if (confirm('¿Deseas cerrar la sesión actual?')) {
      await logout()
    }
  })
}

function buildDisplayName(user) {
  return [
    user.user_metadata?.primer_nombre,
    user.user_metadata?.apellido_paterno
  ].filter(Boolean).join(' ') || user.email.split('@')[0]
}

function addDashboardStyles() {
  if (!document.getElementById('portal-shell-styles')) {
    const style = document.createElement('style')
    style.id = 'portal-shell-styles'
    style.textContent = `
      :root {
        --portal-bg: linear-gradient(180deg, #eaf4ff 0%, #f7f9fc 40%, #ffffff 100%);
        --portal-sidebar: #111827;
        --portal-sidebar-soft: #1f2937;
        --portal-main: #f5f8fc;
        --portal-border: #dce5f2;
        --portal-text: #0f172a;
        --portal-muted: #52627a;
        --portal-accent: #0e7490;
        --portal-card: #ffffff;
      }

      body {
        margin: 0;
        font-family: 'Segoe UI', 'Trebuchet MS', sans-serif;
        color: var(--portal-text);
        background: var(--portal-bg);
      }

      .portal-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
      }

      .portal-sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        background: radial-gradient(circle at top, #1f2937, #111827 65%);
        color: #fff;
        display: flex;
        flex-direction: column;
        padding: 1.2rem;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        z-index: 20;
      }

      .portal-brand {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 1.2rem;
      }

      .portal-brand-mark {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        font-weight: 700;
      }

      .portal-brand h1 {
        margin: 0;
        font-size: 1.1rem;
      }

      .portal-brand p {
        margin: 0;
        color: #b8c4d8;
        font-size: 0.82rem;
      }

      .portal-nav {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        overflow-y: auto;
      }

      .portal-nav-item {
        border: 1px solid transparent;
        background: transparent;
        color: #e2e8f0;
        border-radius: 14px;
        padding: 0.8rem;
        text-align: left;
        display: grid;
        grid-template-columns: 22px 1fr;
        grid-template-areas:
          'icon label'
          '. description';
        gap: 0.2rem 0.6rem;
      }

      .portal-nav-item i {
        grid-area: icon;
        font-size: 1rem;
        margin-top: 0.1rem;
      }

      .portal-nav-item span {
        grid-area: label;
        font-size: 0.95rem;
        font-weight: 600;
      }

      .portal-nav-item small {
        grid-area: description;
        color: #aab7ca;
        font-size: 0.76rem;
      }

      .portal-nav-item:hover,
      .portal-nav-item.active {
        background: rgba(14, 116, 144, 0.22);
        border-color: rgba(56, 189, 248, 0.35);
      }

      .portal-sidebar-footer {
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .portal-main {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .portal-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.2rem;
        border-bottom: 1px solid var(--portal-border);
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
      }

      .portal-topbar h2 {
        margin: 0;
        font-size: 1.05rem;
      }

      .portal-topbar p {
        margin: 0;
        color: var(--portal-muted);
        font-size: 0.82rem;
      }

      .portal-user-pill {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 999px;
        padding: 0.35rem 0.85rem;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .portal-user-pill span {
        font-size: 0.82rem;
        font-weight: 700;
      }

      .portal-user-pill small {
        font-size: 0.73rem;
        color: #0369a1;
      }

      .portal-menu-btn {
        display: none;
        border: 1px solid var(--portal-border);
        border-radius: 8px;
        background: #fff;
        width: 34px;
        height: 34px;
      }

      .portal-content {
        padding: 1rem 1.2rem 1.8rem;
      }

      .portal-loading {
        min-height: 220px;
        display: grid;
        place-items: center;
        gap: 0.8rem;
        color: var(--portal-muted);
      }

      .portal-hero {
        border-radius: 18px;
        padding: 1.2rem;
        color: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .portal-hero-admin {
        background: linear-gradient(120deg, #0f766e, #0369a1);
      }

      .portal-hero-teacher {
        background: linear-gradient(120deg, #8b5cf6, #4338ca);
      }

      .portal-hero-student {
        background: linear-gradient(120deg, #f97316, #ea580c);
      }

      .portal-hero h2 {
        margin: 0;
        font-size: 1.2rem;
      }

      .portal-hero p {
        margin: 0.25rem 0 0;
        color: rgba(248, 250, 252, 0.92);
      }

      .portal-hero-chip {
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        padding: 0.35rem 0.8rem;
        display: inline-flex;
        gap: 0.4rem;
        align-items: center;
        white-space: nowrap;
      }

      .portal-grid {
        display: grid;
        gap: 0.9rem;
        margin-bottom: 1rem;
      }

      .portal-grid-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .portal-grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .portal-card {
        background: var(--portal-card);
        border: 1px solid var(--portal-border);
        border-radius: 16px;
        padding: 1rem;
      }

      .portal-card h4 {
        margin-top: 0;
      }

      .metric {
        background: linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%);
      }

      .metric small {
        color: var(--portal-muted);
      }

      .metric h3 {
        margin: 0.35rem 0 0;
        font-size: 1.8rem;
      }

      .metric .metric-text {
        font-size: 1.15rem;
      }

      .metric-wide p {
        margin-bottom: 0;
        color: var(--portal-muted);
      }

      .portal-big-number {
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 0;
      }

      .portal-shortcuts {
        display: flex;
        flex-wrap: wrap;
        gap: 0.7rem;
      }

      .portal-shortcut {
        border: 1px solid #bae6fd;
        background: #f0f9ff;
        border-radius: 12px;
        padding: 0.6rem 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        color: #075985;
        font-weight: 600;
      }

      .portal-card-header-inline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
      }

      .portal-badge {
        border-radius: 999px;
        background: #cffafe;
        color: #155e75;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .portal-course-list {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
      }

      .portal-course-item {
        border: 1px solid var(--portal-border);
        border-radius: 12px;
        padding: 0.75rem;
        background: #fff;
      }

      .portal-course-item h5 {
        margin: 0;
      }

      .portal-course-item p {
        margin: 0.2rem 0 0;
        color: var(--portal-muted);
      }

      .portal-course-meta {
        margin-top: 0.55rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem 0.8rem;
        color: #0f172a;
        font-size: 0.82rem;
      }

      .portal-course-meta span {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
      }

      .empty-state {
        text-align: center;
        padding: 2rem 1rem;
      }

      .empty-state i {
        font-size: 2rem;
        color: #94a3b8;
      }

      .portal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 15;
      }

      .portal-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }

      @media (max-width: 1100px) {
        .portal-grid-3 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 991px) {
        .portal-shell {
          grid-template-columns: 1fr;
        }

        .portal-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          transform: translateX(-100%);
          transition: transform 0.22s ease;
          width: 280px;
        }

        .portal-sidebar.open {
          transform: translateX(0);
        }

        .portal-menu-btn {
          display: inline-grid;
          place-items: center;
        }
      }

      @media (max-width: 680px) {
        .portal-grid-3,
        .portal-grid-2 {
          grid-template-columns: 1fr;
        }

        .portal-topbar {
          align-items: flex-start;
          gap: 0.7rem;
        }

        .portal-user-pill {
          display: none;
        }
      }
    `

    document.head.appendChild(style)
  }

  if (!document.getElementById('portal-bootstrap-icons')) {
    const icons = document.createElement('link')
    icons.id = 'portal-bootstrap-icons'
    icons.rel = 'stylesheet'
    icons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css'
    document.head.appendChild(icons)
  }
}
