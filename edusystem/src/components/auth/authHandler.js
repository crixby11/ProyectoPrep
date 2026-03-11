import { supabase } from '../../lib/supabaseClient.js'
import { renderApp } from '../../app.js'
import { clearPermissionsCache } from '../../utils/permissions.js'

/**
 * Inicializa el manejo de autenticación
 */
export async function initAuth() {
  // Escuchar cambios en autenticación
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event)
  })
}

/**
 * Login con email y password
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

/**
 * Registro de nuevo usuario
 */
export async function register(email, password, userData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData // role, nombre, etc.
    }
  })
  
  if (error) throw error
  return data
}

/**
 * Logout
 */
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  
  // Limpiar cache de permisos
  clearPermissionsCache()
  
  // Redirigir a login
  renderApp()
}

/**
 * Recuperar contraseña
 */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  if (error) throw error
}
