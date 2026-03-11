/**
 * Helpers y utilidades generales
 */

/**
 * Formatea una fecha a formato local
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Date(date).toLocaleDateString('es-MX', { ...defaultOptions, ...options })
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date) {
  return new Date(date).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Muestra un mensaje de error al usuario
 */
export function showError(message, container = document.body) {
  const alert = document.createElement('div')
  alert.className = 'alert alert-danger alert-dismissible fade show'
  alert.role = 'alert'
  alert.innerHTML = `
    <strong>Error:</strong> ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `
  
  container.insertBefore(alert, container.firstChild)
  
  // Auto-cerrar después de 5 segundos
  setTimeout(() => alert.remove(), 5000)
}

/**
 * Muestra un mensaje de éxito al usuario
 */
export function showSuccess(message, container = document.body) {
  const alert = document.createElement('div')
  alert.className = 'alert alert-success alert-dismissible fade show'
  alert.role = 'alert'
  alert.innerHTML = `
    <strong>Éxito:</strong> ${message}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  `
  
  container.insertBefore(alert, container.firstChild)
  
  // Auto-cerrar después de 3 segundos
  setTimeout(() => alert.remove(), 3000)
}

/**
 * Debounce para optimizar búsquedas
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Valida si un email es válido
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Trunca texto a un número de caracteres
 */
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
