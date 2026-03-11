import { supabase } from './lib/supabaseClient.js'
import { renderLogin } from './pages/auth/login.js'
import { renderDashboard } from './components/dashboard/dashboard.js'

/**
 * Renderiza la aplicación principal según el estado de autenticación
 */
export async function renderApp() {
  const app = document.getElementById('app')
  
  // Verificar sesión actual
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    // Usuario autenticado - mostrar dashboard
    const user = session.user
    const role = user.user_metadata?.role || 'student'
    
    console.log(`👤 Usuario: ${user.email} | Rol: ${role}`)
    renderDashboard(app, user, role)
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
