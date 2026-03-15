import { supabase } from './lib/supabaseClient.js'
import { renderLogin } from './pages/auth/login.js'
import { renderDashboard } from './components/dashboard/dashboard.js'
import { resolveUserRole } from './utils/permissions.js'

/**
 * Renderiza la aplicación principal según el estado de autenticación
 */
export async function renderApp() {
  const app = document.getElementById('app')
  
  if (!app) {
    console.error('❌ Error: No se encontró el elemento #app en el DOM')
    return
  }
  
  // Verificar sesión actual
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    // Usuario autenticado - mostrar dashboard
    const user = session.user
    const role = await resolveUserRole(user)
    
    console.log(`🟢 Usuario: ${user.email} | Rol: ${role}`)
    
    try {
      renderDashboard(app, user, role)
    } catch (error) {
      console.error('Error renderizando dashboard:', error)
      app.innerHTML = `<div style="padding: 20px; color: red;">Error al cargar el portal. Por favor recarga la página.</div>`
    }
  } else {
    // Usuario no autenticado - mostrar login
    renderLogin(app)
  }
}

/**
 * Escuchar cambios en el estado de autenticación
 */
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth event:', event)
  
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    renderApp()
  }
})
