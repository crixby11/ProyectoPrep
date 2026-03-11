import { createClient } from '@supabase/supabase-js'

// Obtener credenciales de las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las credenciales existan
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Faltan credenciales de Supabase en .env.local')
  console.error('Copia .env.local.example a .env.local y completa las credenciales')
}

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper para obtener el usuario actual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper para obtener el rol del usuario
export async function getUserRole() {
  const user = await getCurrentUser()
  return user?.user_metadata?.role || null
}

// Helper para obtener el perfil completo del usuario
export async function getUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return data
}
