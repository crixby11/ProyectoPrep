import { supabase } from '../lib/supabaseClient.js'

// Cache de permisos del usuario actual
let userPermissions = null
let currentUserRole = null

const ROLE_FALLBACK_MODULES = {
  admin: ['dashboard', 'general', 'users', 'courses'],
  teacher: ['dashboard', 'teacher-courses', 'teacher-students', 'attendance'],
  student: ['dashboard', 'inscriptions', 'my-courses', 'my-progress'],
  parent: ['dashboard', 'my-courses', 'my-progress']
}

/**
 * Resuelve el rol real desde profiles y usa metadata como fallback
 */
export async function resolveUserRole(user) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return profile?.rol || user.user_metadata?.role || 'student'
  } catch (error) {
    console.warn('No se pudo resolver rol desde profiles, usando metadata:', error.message)
    return user.user_metadata?.role || 'student'
  }
}

/**
 * Cargar permisos del usuario actual
 */
export async function loadUserPermissions(userId, knownRole = null) {
  try {
    userPermissions = {}

    if (knownRole) {
      currentUserRole = knownRole
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      currentUserRole = profile?.rol || 'student'
    }
    
    // Get role permissions
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('rol', currentUserRole)

    if (permError) {
      if (permError.code === 'PGRST205') {
        console.warn('Tabla role_permissions no existe; usando permisos fallback por rol.')
        return userPermissions
      }

      throw permError
    }
    
    // Convert to map for faster lookup
    userPermissions = {}
    permissions.forEach(perm => {
      userPermissions[perm.module] = {
        can_view: perm.can_view,
        can_create: perm.can_create,
        can_edit: perm.can_edit,
        can_delete: perm.can_delete
      }
    })
    
    return userPermissions
  } catch (error) {
    console.error('Error cargando permisos:', error)
    userPermissions = {}
    return userPermissions
  }
}

/**
 * Verificar si el usuario puede ver un módulo
 */
export function canViewModule(moduleName) {
  if (!currentUserRole) return false

  if (!userPermissions || !userPermissions[moduleName]) {
    return (ROLE_FALLBACK_MODULES[currentUserRole] || []).includes(moduleName)
  }
  
  return userPermissions[moduleName].can_view
}

/**
 * Verificar si el usuario puede crear en un módulo
 */
export function canCreateInModule(moduleName) {
  if (!userPermissions || !userPermissions[moduleName]) {
    return (ROLE_FALLBACK_MODULES[currentUserRole] || []).includes(moduleName)
  }
  
  return userPermissions[moduleName].can_create
}

/**
 * Verificar si el usuario puede editar en un módulo
 */
export function canEditInModule(moduleName) {
  if (!userPermissions || !userPermissions[moduleName]) {
    return (ROLE_FALLBACK_MODULES[currentUserRole] || []).includes(moduleName)
  }
  
  return userPermissions[moduleName].can_edit
}

/**
 * Verificar si el usuario puede eliminar en un módulo
 */
export function canDeleteInModule(moduleName) {
  if (!userPermissions || !userPermissions[moduleName]) {
    return false
  }
  
  return userPermissions[moduleName].can_delete
}

/**
 * Obtener todos los módulos visibles para el rol actual
 */
export function getVisibleModules() {
  if (!currentUserRole) return []

  const fallback = ROLE_FALLBACK_MODULES[currentUserRole] || []
  if (!userPermissions) return fallback
  
  const explicit = Object.keys(userPermissions).filter(module => 
    userPermissions[module].can_view
  )

  const merged = new Set([...fallback, ...explicit])
  return Array.from(merged)
}

/**
 * Filtrar elementos del sidebar basado en permisos
 */
export function filterSidebarByPermissions(sidebarElement) {
  const navLinks = sidebarElement.querySelectorAll('.nav-link[data-view]')
  
  navLinks.forEach(link => {
    const moduleName = link.dataset.view
    
    if (!canViewModule(moduleName)) {
      // Ocultar el nav-item completo
      const navItem = link.closest('.nav-item')
      if (navItem) {
        navItem.style.display = 'none'
      }
    }
  })
}

/**
 * Validar acceso a módulo antes de renderizar
 */
export function validateModuleAccess(moduleName) {
  if (!canViewModule(moduleName)) {
    throw new Error(`No tienes permiso para acceder al módulo: ${moduleName}`)
  }
  
  return true
}

/**
 * Obtener objeto de permisos para un módulo específico
 */
export function getModulePermissions(moduleName) {
  return userPermissions?.[moduleName] || {
    can_view: canViewModule(moduleName),
    can_create: canCreateInModule(moduleName),
    can_edit: canEditInModule(moduleName),
    can_delete: false
  }
}

/**
 * Obtener el rol activo actual
 */
export function getCurrentRole() {
  return currentUserRole
}

/**
 * Limpiar cache de permisos (útil al cerrar sesión)
 */
export function clearPermissionsCache() {
  userPermissions = null
  currentUserRole = null
}
