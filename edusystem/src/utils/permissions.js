import { supabase } from '../lib/supabaseClient.js'

// Cache de permisos del usuario actual
let userPermissions = null
let currentUserRole = null

/**
 * Cargar permisos del usuario actual
 */
export async function loadUserPermissions(userId) {
  try {
    // Get user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .single()
    
    if (profileError) throw profileError
    
    currentUserRole = profile.rol
    
    // Get role permissions
    const { data: permissions, error: permError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('rol', profile.rol)
    
    if (permError) throw permError
    
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
    return {}
  }
}

/**
 * Verificar si el usuario puede ver un módulo
 */
export function canViewModule(moduleName) {
  // Admin siempre tiene acceso
  if (currentUserRole === 'admin') return true
  
  if (!userPermissions || !userPermissions[moduleName]) {
    return false
  }
  
  return userPermissions[moduleName].can_view
}

/**
 * Verificar si el usuario puede crear en un módulo
 */
export function canCreateInModule(moduleName) {
  if (currentUserRole === 'admin') return true
  
  if (!userPermissions || !userPermissions[moduleName]) {
    return false
  }
  
  return userPermissions[moduleName].can_create
}

/**
 * Verificar si el usuario puede editar en un módulo
 */
export function canEditInModule(moduleName) {
  if (currentUserRole === 'admin') return true
  
  if (!userPermissions || !userPermissions[moduleName]) {
    return false
  }
  
  return userPermissions[moduleName].can_edit
}

/**
 * Verificar si el usuario puede eliminar en un módulo
 */
export function canDeleteInModule(moduleName) {
  if (currentUserRole === 'admin') return true
  
  if (!userPermissions || !userPermissions[moduleName]) {
    return false
  }
  
  return userPermissions[moduleName].can_delete
}

/**
 * Obtener todos los módulos visibles para el rol actual
 */
export function getVisibleModules() {
  if (currentUserRole === 'admin') {
    // Admin ve todos los módulos
    return [
      'dashboard', 'courses', 'students', 'teachers', 
      'enrollments', 'grades', 'attendance', 'tasks',
      'resources', 'messages', 'users', 'settings'
    ]
  }
  
  if (!userPermissions) return []
  
  return Object.keys(userPermissions).filter(module => 
    userPermissions[module].can_view
  )
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
  if (currentUserRole === 'admin') {
    return {
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: true
    }
  }
  
  return userPermissions?.[moduleName] || {
    can_view: false,
    can_create: false,
    can_edit: false,
    can_delete: false
  }
}

/**
 * Limpiar cache de permisos (útil al cerrar sesión)
 */
export function clearPermissionsCache() {
  userPermissions = null
  currentUserRole = null
}
