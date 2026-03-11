# 🏗️ Arquitectura del Sistema - EduSystem

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Vanilla JavaScript + CSS                 │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │   │
│  │  │Teacher │  │Student │  │ Parent │  │ Admin  │ │   │
│  │  │  UI    │  │   UI   │  │   UI   │  │   UI   │ │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘ │   │
│  │                                                   │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │      Componentes Compartidos               │  │   │
│  │  │  - Auth  - Dashboard - Courses - Grades    │  │   │
│  │  │  - Attendance - Tasks - Messages - Notif.  │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │        Supabase Client (@supabase/supabase-js)   │   │
│  │        - Auth  - Database  - Realtime            │   │
│  │        - Storage                                 │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (Anon Key)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE (Backend)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Supabase Auth                       │   │
│  │  - Email/Password  - Magic Links  - OAuth        │   │
│  │  - JWT Tokens      - User Metadata (role)        │   │
│  └──────────────────────────────────────────────────┘   │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database (14 tablas)          │   │
│  │                                                   │   │
│  │  Usuarios y Perfiles:                            │   │
│  │  - profiles  - students  - instituciones         │   │
│  │                                                   │   │
│  │  Académico:                                       │   │
│  │  - courses  - course_sections  - schedules       │   │
│  │  - enrollments  - estudios                       │   │
│  │                                                   │   │
│  │  Evaluación:                                      │   │
│  │  - tasks  - grades  - attendance                 │   │
│  │                                                   │   │
│  │  Comunicación:                                    │   │
│  │  - notifications  - messages                     │   │
│  │                                                   │   │
│  │  Recursos:                                        │   │
│  │  - study_resources  - study_recommendations      │   │
│  │                                                   │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  Row Level Security (RLS)                  │  │   │
│  │  │  └─ Políticas por rol y tabla              │  │   │
│  │  │                                             │  │   │
│  │  │  Triggers:                                  │  │   │
│  │  │  └─ Auto-crear perfiles                    │  │   │
│  │  │  └─ Notificaciones automáticas             │  │   │
│  │  │  └─ Actualizar timestamps                  │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Supabase Realtime                     │   │
│  │  - Notificaciones en tiempo real                 │   │
│  │  - Updates de calificaciones                     │   │
│  │  - Mensajes nuevos                               │   │
│  └──────────────────────────────────────────────────┘   │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Supabase Storage                      │   │
│  │  - Archivos de tareas (task-files bucket)        │   │
│  │  - Documentos de cursos                          │   │
│  │  - Avatares de usuarios                          │   │
│  └──────────────────────────────────────────────────┘   │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Edge Functions (Opcional)                │   │
│  │  - Envío de emails                               │   │
│  │  - Cálculo de promedios                          │   │
│  │  - Reportes complejos                            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

### Autenticación
```
Usuario → Login Form → Supabase Auth → JWT Token → 
Store en localStorage → Auto-refresh → RLS aplica permisos
```

### Consulta de Datos (Ejemplo: Ver Calificaciones)
```
1. Usuario autenticado hace request
2. Supabase Client envía query con JWT
3. PostgreSQL verifica RLS policies
4. Filtra datos según rol del usuario
5. Retorna solo datos permitidos
6. Frontend renderiza resultados
```

### Notificaciones en Tiempo Real
```
1. Maestro toma asistencia → INSERT en attendance
2. Trigger detecta falta → INSERT en notifications
3. Supabase Realtime emite evento
4. Cliente escuchando recibe notificación
5. UI actualiza contador/badge de notificaciones
```

## 🎯 Flujo por Rol de Usuario

### Estudiante
```
Login → Dashboard Estudiante
  ├─ Ver mis cursos (enrollments filtrado por RLS)
  ├─ Ver calificaciones (grades filtrado por student_id)
  ├─ Subir tareas (INSERT en grades con validación)
  ├─ Ver asistencia (attendance filtrado)
  └─ Recibir notificaciones (realtime subscription)
```

### Maestro
```
Login → Dashboard Maestro
  ├─ Ver mis secciones (course_sections filtrado por teacher_id)
  ├─ Crear tareas (INSERT en tasks)
  │   └─ Trigger: Notificar a estudiantes
  ├─ Calificar tareas (UPDATE en grades)
  ├─ Tomar asistencia (INSERT en attendance)
  │   └─ Trigger: Notificar padre si falta
  └─ Ver mensajes de estudiantes
```

### Padre
```
Login → Dashboard Padre
  ├─ Ver hijo (students filtrado por tutor_profile_id)
  ├─ Ver calificaciones hijo (grades JOIN students)
  ├─ Ver asistencia hijo (attendance filtrado)
  ├─ Recibir notificaciones de faltas (trigger automático)
  └─ Enviar mensajes a maestros
```

### Administrador
```
Login → Dashboard Admin
  ├─ Ver todos los usuarios (profiles sin restricción RLS)
  ├─ Gestionar instituciones (CRUD instituciones)
  ├─ Gestionar cursos (CRUD courses)
  ├─ Ver reportes globales
  └─ Monitorear actividad del sistema
```

## 🔒 Capas de Seguridad

### Layer 1: Autenticación
- Supabase Auth verifica identidad
- JWT tokens con expiración
- Refresh tokens automáticos

### Layer 2: Row Level Security (RLS)
- PostgreSQL valida cada query
- Políticas por tabla y rol
- Filtra datos automáticamente

### Layer 3: Validación Frontend
- Validación de inputs
- Sanitización de datos
- Feedback inmediato al usuario

### Layer 4: Edge Functions (Futuro)
- Lógica sensible en servidor
- Validaciones complejas
- Integraciones externas

## 📦 Estructura de Archivos

```
edusystem/
├── src/
│   ├── main.js                 # Punto de entrada
│   ├── app.js                  # Lógica principal, router
│   │
│   ├── lib/                    # Configuración y utilidades
│   │   ├── supabaseClient.js   # Cliente Supabase
│   │   └── helpers.js          # Funciones helper
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── auth/
│   │   │   └── authHandler.js  # Login, logout, register
│   │   ├── dashboard/
│   │   │   └── dashboard.js    # Dashboards por rol
│   │   ├── courses/            # (por implementar)
│   │   ├── grades/             # (por implementar)
│   │   ├── attendance/         # (por implementar)
│   │   ├── tasks/              # (por implementar)
│   │   ├── messages/           # (por implementar)
│   │   └── notifications/      # (por implementar)
│   │
│   ├── pages/                  # Páginas completas
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   ├── register.js
│   │   │   └── password-reset.js
│   │   ├── teacher/            # (por implementar)
│   │   ├── student/            # (por implementar)
│   │   ├── parent/             # (por implementar)
│   │   └── admin/              # (por implementar)
│   │
│   └── styles/
│       └── main.css            # Estilos globales
│
├── database/                   # Scripts SQL
│   ├── schema.sql              # Crear tablas
│   ├── rls-policies.sql        # Políticas de seguridad
│   ├── triggers.sql            # Triggers automáticos
│   ├── seed.sql                # Datos de prueba
│   └── README.md               # Guía de configuración
│
├── public/                     # Archivos estáticos
├── index.html                  # HTML principal
├── vite.config.js              # Config de Vite
├── package.json
├── .env.local.example          # Plantilla de variables
│
├── README.md                   # Documentación principal
├── GETTING_STARTED.md          # Guía de inicio
├── DEPLOYMENT.md               # Guía de deployment
└── TESTING.md                  # Guía de testing
```

## 🚀 Flujo de Desarrollo

### Para Agregar un Nuevo Módulo

1. **Planificar**
   - Definir qué hace el módulo
   - Identificar tablas necesarias
   - Definir permisos por rol

2. **Base de Datos**
   - Crear/modificar tablas si es necesario
   - Agregar políticas RLS
   - Crear triggers si aplica

3. **Frontend**
   ```bash
   # Crear archivos del módulo
   src/components/nuevo-modulo/
     ├── index.js           # Exportaciones
     ├── list.js            # Lista de items
     ├── create.js          # Crear nuevo
     ├── edit.js            # Editar existente
     └── delete.js          # Eliminar
   ```

4. **Conectar con Supabase**
   ```js
   import { supabase } from '../../lib/supabaseClient.js'
   
   // Queries automáticamente filtradas por RLS
   const { data, error } = await supabase
     .from('tabla')
     .select('*')
   ```

5. **Integrar en Dashboard**
   - Agregar enlace en sidebar
   - Crear ruta en app.js
   - Agregar tests

## 📊 Métricas del Sistema

### Base de Datos
- **14 tablas** principales
- **~40 políticas RLS** para seguridad
- **6 triggers** automáticos
- **12 índices** para performance

### Frontend
- **Vanilla JavaScript** (sin dependencias pesadas)
- **Solo 1 dependencia**: @supabase/supabase-js
- **Build size**: ~200KB (optimizado)
- **Tiempo de carga**: < 1s

### Capacidad
- **Multi-tenant**: Soporta múltiples instituciones
- **Escalable**: PostgreSQL gestionado por Supabase
- **Tiempo real**: Notificaciones instantáneas
- **Almacenamiento**: Ilimitado con Supabase Storage

## 🔮 Roadmap

### Fase 1: Base ✅ (Completada)
- [x] Autenticación
- [x] Base de datos
- [x] Dashboards básicos

### Fase 2: Módulos Core 🚧 (En Progreso)
- [ ] Gestión de cursos completa
- [ ] Sistema de calificaciones
- [ ] Toma de asistencia
- [ ] Gestión de tareas

### Fase 3: Comunicación
- [ ] Notificaciones UI
- [ ] Mensajería interna
- [ ] Chatbot de asistencia

### Fase 4: Avanzado
- [ ] Reportes y estadísticas
- [ ] Calendario de actividades
- [ ] Exportación de datos
- [ ] Integraciones externas

### Fase 5: Optimización
- [ ] PWA (Progressive Web App)
- [ ] Offline support
- [ ] Performance tuning
- [ ] SEO optimization

---

**Última actualización**: Marzo 10, 2026
