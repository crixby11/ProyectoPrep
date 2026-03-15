import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/main.css'
import { supabase } from './lib/supabaseClient.js'
import { initAuth } from './components/auth/authHandler.js'
import { renderApp } from './app.js'

// Inicializar la aplicación
async function init() {
  console.log('🎓 EduSystem iniciando...')
  
  // Verificar conexión con Supabase
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    console.log('✅ Conectado a Supabase')
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message)
  }

  // Inicializar autenticación
  await initAuth()
  
  // Renderizar aplicación
  renderApp()
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
