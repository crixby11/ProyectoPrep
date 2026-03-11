# 🧪 Guía de Testing - EduSystem

## Testing Manual

### 1. Test de Autenticación

#### Registro
- [ ] Registrar nuevo usuario estudiante
- [ ] Registrar nuevo usuario maestro
- [ ] Registrar nuevo usuario padre
- [ ] Verificar que se cree el perfil en `profiles`
- [ ] Verificar que estudiantes se creen en `students`
- [ ] Probar con email inválido (debe fallar)
- [ ] Probar con contraseña corta (debe fallar)
- [ ] Probar con contraseñas que no coinciden (debe fallar)

#### Login
- [ ] Login con credenciales correctas
- [ ] Login con credenciales incorrectas (debe fallar)
- [ ] Verificar que redirige al dashboard correcto según rol
- [ ] Verificar que la sesión persiste al recargar

#### Logout
- [ ] Cerrar sesión
- [ ] Verificar que redirige a login
- [ ] Verificar que no se puede acceder a rutas protegidas

#### Recuperación de contraseña
- [ ] Solicitar reset de contraseña
- [ ] Verificar que llega el email
- [ ] Cambiar contraseña usando el link
- [ ] Login con nueva contraseña

### 2. Test de Roles y Permisos (RLS)

#### Como Estudiante
- [ ] Ver solo mis calificaciones
- [ ] No puedo ver calificaciones de otros estudiantes
- [ ] Puedo ver mis cursos inscritos
- [ ] Puedo subir tareas
- [ ] No puedo calificar tareas
- [ ] Veo notificaciones de tareas pendientes

#### Como Maestro
- [ ] Veo todas las secciones que enseño
- [ ] Puedo crear tareas para mis secciones
- [ ] Puedo calificar tareas de mis estudiantes
- [ ] No puedo calificar tareas de otras secciones
- [ ] Puedo tomar asistencia
- [ ] Recibo notificaciones de mensajes

#### Como Padre
- [ ] Veo calificaciones de mi hijo
- [ ] No veo calificaciones de otros estudiantes
- [ ] Veo asistencia de mi hijo
- [ ] Recibo notificaciones de faltas
- [ ] Puedo enviar mensajes al maestro

#### Como Admin
- [ ] Veo todos los usuarios
- [ ] Puedo ver todas las calificaciones
- [ ] Puedo gestionar instituciones
- [ ] Puedo gestionar cursos

### 3. Test de Módulos

#### Módulo de Calificaciones
```sql
-- Test: Estudiante solo ve sus calificaciones
-- Login como estudiante (ID: xxx)
SELECT * FROM grades WHERE student_id = 'xxx';
-- Debe retornar solo las del estudiante

-- Test: Estudiante NO puede ver otras calificaciones
SELECT * FROM grades WHERE student_id != 'xxx';
-- Debe retornar vacío por RLS
```

#### Módulo de Asistencia
```sql
-- Test: Maestro toma asistencia
INSERT INTO attendance (section_id, student_id, fecha, estado, registrado_por)
VALUES ('section-id', 'student-id', CURRENT_DATE, 'presente', 'teacher-id');

-- Test: Trigger de notificación al padre
INSERT INTO attendance (section_id, student_id, fecha, estado)
VALUES ('section-id', 'student-id', CURRENT_DATE, 'ausente');
-- Verificar que se creó notificación en tabla notifications
SELECT * FROM notifications WHERE tipo = 'falta' ORDER BY created_at DESC LIMIT 1;
```

#### Módulo de Tareas
```sql
-- Test: Crear tarea
INSERT INTO tasks (section_id, teacher_id, titulo, descripcion, fecha_limite, puntos_max)
VALUES ('section-id', 'teacher-id', 'Tarea 1', 'Descripción', '2026-03-20', 100);

-- Verificar que se notificó a estudiantes
SELECT * FROM notifications WHERE tipo = 'tarea_pendiente' ORDER BY created_at DESC;
```

### 4. Test de Triggers

#### Trigger: Crear perfil automáticamente
```sql
-- Simular registro de usuario (normalmente lo hace Supabase Auth)
-- El trigger debe crear automáticamente el perfil

-- Verificar:
SELECT * FROM profiles WHERE email = 'nuevo@usuario.com';
```

#### Trigger: Notificar falta al padre
```sql
-- Insertar falta
INSERT INTO attendance (section_id, student_id, fecha, estado)
VALUES ('section-id', 'student-id', CURRENT_DATE, 'ausente');

-- Verificar notificación
SELECT n.*, p.nombre as parent_name
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.tipo = 'falta'
ORDER BY n.created_at DESC LIMIT 1;
```

### 5. Test de Performance

```sql
-- Verificar índices
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Analizar query lento
EXPLAIN ANALYZE
SELECT g.*, s.matricula, p.nombre
FROM grades g
JOIN students s ON s.id = g.student_id
JOIN profiles p ON p.id = s.profile_id
WHERE g.task_id = 'task-id';
```

### 6. Test de Seguridad

#### Intentar bypass de RLS
```sql
-- Como estudiante, intentar UPDATE de calificación de otro
UPDATE grades
SET puntos_obtenidos = 100
WHERE student_id != 'my-student-id';
-- Debe fallar por RLS

-- Intentar ver perfiles de otros
SELECT * FROM profiles WHERE id != auth.uid();
-- Debe retornar vacío o solo permitidos por políticas
```

## Testing Automatizado (Opcional)

### Setup

```bash
npm install -D vitest @vitest/ui jsdom
```

### Configurar Vitest

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

### Ejemplo de Test

```js
// src/lib/__tests__/helpers.test.js
import { describe, it, expect } from 'vitest'
import { formatDate, isValidEmail } from '../helpers'

describe('Helpers', () => {
  it('formatea fechas correctamente', () => {
    const fecha = new Date('2026-03-10')
    const result = formatDate(fecha)
    expect(result).toContain('marzo')
  })

  it('valida emails correctamente', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid')).toBe(false)
  })
})
```

```bash
# Ejecutar tests
npm run test
```

## Checklist Completo

### Funcionalidades Core
- [ ] Registro de usuarios
- [ ] Login de usuarios
- [ ] Logout
- [ ] Recuperación de contraseña
- [ ] Creación automática de perfiles
- [ ] Dashboards por rol

### Módulos
- [ ] Gestión de cursos
- [ ] Inscripción de estudiantes
- [ ] Creación de tareas
- [ ] Subida de tareas por estudiantes
- [ ] Calificación de tareas por maestros
- [ ] Toma de asistencia
- [ ] Visualización de calificaciones
- [ ] Mensajería entre usuarios

### Notificaciones
- [ ] Notificación de nueva tarea
- [ ] Notificación de falta al padre
- [ ] Notificación de calificación publicada

### Seguridad
- [ ] RLS activo en todas las tablas
- [ ] Políticas de acceso funcionando
- [ ] Solo anon key en frontend
- [ ] Validación de inputs

### Performance
- [ ] Queries optimizados con índices
- [ ] Carga rápida de dashboard
- [ ] Sin queries N+1

## Scripts de Test SQL

```sql
-- Script completo de testing
-- Ejecutar en Supabase SQL Editor

-- 1. Limpiar datos de prueba anteriores
DELETE FROM notifications WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@test.com'
);
DELETE FROM attendance WHERE student_id IN (
  SELECT id FROM students WHERE profile_id IN (
    SELECT id FROM profiles WHERE email LIKE '%@test.com'
  )
);
-- ... más cleanups

-- 2. Crear datos de prueba
INSERT INTO instituciones (nombre, tipo) VALUES 
  ('Test University', 'universidad');

-- 3. Ejecutar tests...

-- 4. Verificar resultados
SELECT 'PASS' as status WHERE (
  SELECT COUNT(*) FROM profiles WHERE email LIKE '%@test.com'
) > 0;
```

## Reportar Bugs

Cuando encuentres un bug, documenta:

1. **Pasos para reproducir**
2. **Comportamiento esperado**
3. **Comportamiento actual**
4. **Rol del usuario**
5. **Logs de consola**
6. **Screenshots (si aplica)**

## Mejora Continua

- Agregar tests automatizados para casos críticos
- Implementar CI/CD con tests automáticos
- Monitorear errores en producción
- Recolectar feedback de usuarios
