# Sistema de Permisos por Rol

Este sistema controla qué módulos puede acceder cada rol y qué acciones puede realizar.

## Estructura de Base de Datos

### Tabla: `role_permissions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `rol` | VARCHAR(50) | Rol del usuario (admin, teacher, student, parent) |
| `module` | VARCHAR(100) | Nombre del módulo (courses, students, etc.) |
| `can_view` | BOOLEAN | Puede ver el módulo |
| `can_create` | BOOLEAN | Puede crear elementos |
| `can_edit` | BOOLEAN | Puede editar elementos |
| `can_delete` | BOOLEAN | Puede eliminar elementos |

## Módulos Disponibles

- `dashboard` - Dashboard principal
- `courses` - Gestión de cursos
- `students` - Gestión de estudiantes
- `teachers` - Gestión de maestros
- `enrollments` - Inscripciones
- `grades` - Calificaciones
- `attendance` - Asistencia
- `tasks` - Tareas
- `resources` - Biblioteca
- `messages` - Mensajes
- `users` - Usuarios (solo admin)
- `settings` - Configuración

## Instalación

1. Ejecutar el script SQL en Supabase:
   ```bash
   database/create-role-permissions.sql
   ```

2. El script creará:
   - Tabla `role_permissions`
   - Permisos por defecto para cada rol
   - Políticas RLS (Row Level Security)
   - Triggers para updated_at

## Uso en el Código

### Importar Funciones

```javascript
import { 
  canViewModule,
  canCreateInModule,
  canEditInModule,
  canDeleteInModule,
  getModulePermissions
} from '../../utils/permissions.js'
```

### Verificar Permisos

```javascript
// Verificar si puede ver el módulo
if (canViewModule('courses')) {
  // Mostrar contenido
}

// Verificar si puede crear
if (canCreateInModule('courses')) {
  // Mostrar botón "Nuevo Curso"
}

// Verificar si puede editar
if (canEditInModule('courses')) {
  // Mostrar botón "Editar"
}

// Verificar si puede eliminar
if (canDeleteInModule('courses')) {
  // Mostrar botón "Eliminar"
}
```

### Obtener Permisos Completos

```javascript
const permissions = getModulePermissions('courses')
console.log(permissions)
// {
//   can_view: true,
//   can_create: false,
//   can_edit: true,
//   can_delete: false
// }
```

### Ejemplo en un Módulo

```javascript
export async function renderCoursesView(container) {
  const permissions = getModulePermissions('courses')
  
  let html = '<div class="container-fluid">'
  
  // Solo mostrar botón si puede crear
  if (permissions.can_create) {
    html += `
      <button class="btn btn-primary" id="btnNewCourse">
        <i class="bi bi-plus"></i> Nuevo Curso
      </button>
    `
  }
  
  // Tabla de cursos...
  html += '<table class="table">'
  // ...
  
  // Botones de acción condicionales
  if (permissions.can_edit) {
    html += '<button class="btn btn-sm btn-warning">Editar</button>'
  }
  
  if (permissions.can_delete) {
    html += '<button class="btn btn-sm btn-danger">Eliminar</button>'
  }
  
  container.innerHTML = html
}
```

## Configuración de Permisos (Admin)

Los administradores pueden configurar permisos desde:

1. Ir a **Usuarios** en el sidebar
2. Click en **Permisos de Módulos** (pestaña superior derecha)
3. Configurar permisos por rol y módulo
4. Los cambios se guardan automáticamente

### Matriz de Permisos

La interfaz muestra una tabla con:
- **Filas**: Módulos del sistema
- **Columnas**: Roles (Admin, Profesor, Estudiante, Padre)
- **Celdas**: Checkboxes para Ver, Crear, Editar, Eliminar

## Permisos por Defecto

### Admin
- ✅ Acceso total a todos los módulos
- ✅ Todas las acciones (Ver, Crear, Editar, Eliminar)

### Teacher
- ✅ Dashboard (solo ver)
- ✅ Cursos (ver y editar asignados)
- ✅ Estudiantes (solo ver)
- ✅ Calificaciones (gestión completa)
- ✅ Asistencia (gestión completa)
- ✅ Tareas (gestión completa)
- ✅ Recursos (crear y editar)
- ✅ Mensajes
- ❌ Usuarios (sin acceso)
- ❌ Configuración (sin acceso)

### Student
- ✅ Dashboard (solo ver)
- ✅ Cursos inscritos (solo ver)
- ✅ Calificaciones propias (solo ver)
- ✅ Asistencia propia (solo ver)
- ✅ Tareas (ver y entregar)
- ✅ Recursos (solo ver)
- ✅ Mensajes
- ❌ Usuarios (sin acceso)
- ❌ Configuración (sin acceso)

### Parent
- ✅ Dashboard (solo ver)
- ✅ Cursos de hijos (solo ver)
- ✅ Calificaciones de hijos (solo ver)
- ✅ Asistencia de hijos (solo ver)
- ✅ Tareas de hijos (solo ver)
- ✅ Recursos (solo ver)
- ✅ Mensajes con profesores
- ❌ Usuarios (sin acceso)
- ❌ Configuración (sin acceso)

## Seguridad

### Row Level Security (RLS)

- Solo admins pueden modificar permisos
- Usuarios pueden ver permisos de su propio rol
- Políticas aplicadas a nivel de base de datos

### Validación en Frontend

El sidebar se filtra automáticamente:
- Los módulos sin permiso `can_view` se ocultan
- Al intentar acceder, se valida el permiso
- Se muestra error si no tiene acceso

### Validación en Backend

Implementar validación adicional en:
- Supabase RLS policies
- Edge Functions (si se usan)
- API endpoints

## Personalización

### Agregar Nuevo Módulo

1. Agregar entrada en `role_permissions`:
   ```sql
   INSERT INTO role_permissions (rol, module, can_view, can_create, can_edit, can_delete)
   VALUES ('teacher', 'nuevo_modulo', true, false, false, false);
   ```

2. Agregar al sidebar en `dashboard.js`:
   ```html
   <li class="nav-item">
     <a class="nav-link" href="#" data-view="nuevo_modulo">
       <i class="bi bi-icon"></i>
       <span>Nuevo Módulo</span>
     </a>
   </li>
   ```

3. Agregar caso en el switch de navegación:
   ```javascript
   case 'nuevo_modulo':
     const { renderNuevoModulo } = await import('../../modules/nuevo/nuevo.js')
     renderNuevoModulo(mainContent)
     break
   ```

4. Agregar a la lista de módulos en `usersView.js` (función `showPermissionsView`):
   ```javascript
   { id: 'nuevo_modulo', name: 'Nuevo Módulo', icon: 'bi-icon' }
   ```

## Troubleshooting

### El sidebar no se filtra

- Verificar que `loadUserPermissions()` se ejecutó correctamente
- Revisar console para errores
- Verificar que los elementos tienen `data-view` correcto

### Permisos no se guardan

- Verificar políticas RLS en Supabase
- Confirmar que el usuario es admin
- Revisar errores en console del navegador

### Usuario ve módulos sin permiso

- Limpiar cache del navegador
- Verificar que `filterSidebarByPermissions()` se ejecuta
- Revisar que los permisos están en la base de datos

## API de Funciones

### `loadUserPermissions(userId)`
Carga permisos del usuario desde la base de datos.

### `canViewModule(moduleName)`
Retorna `true` si puede ver el módulo.

### `canCreateInModule(moduleName)`
Retorna `true` si puede crear en el módulo.

### `canEditInModule(moduleName)`
Retorna `true` si puede editar en el módulo.

### `canDeleteInModule(moduleName)`
Retorna `true` si puede eliminar en el módulo.

### `getModulePermissions(moduleName)`
Retorna objeto con todos los permisos del módulo.

### `getVisibleModules()`
Retorna array de módulos visibles para el usuario actual.

### `filterSidebarByPermissions(sidebarElement)`
Oculta elementos del sidebar sin permiso de vista.

### `validateModuleAccess(moduleName)`
Lanza error si no tiene permiso, útil para validación.

### `clearPermissionsCache()`
Limpia cache de permisos (llamar al cerrar sesión).

## Roadmap

- [ ] Permisos a nivel de registro (ver solo sus propios datos)
- [ ] Permisos por curso específico
- [ ] Grupos de permisos predefinidos
- [ ] Auditoría de cambios de permisos
- [ ] Permisos temporales con fecha de expiración
