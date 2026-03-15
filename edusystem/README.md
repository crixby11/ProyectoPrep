# EduSystem 🎓

Sistema de Gestión Académica multi-institución para escuelas y universidades.

Desarrollado con **Vite + Vanilla JavaScript + Supabase**.

## ✨ Características

- 🔐 **Autenticación completa** - Registro, login, recuperación de contraseña
- 👥 **4 tipos de usuarios** - Maestros, Estudiantes, Padres, Administradores
- 📚 **Gestión de cursos** - Secciones, horarios, inscripciones
- 📝 **Sistema de calificaciones** - Con fechas límite y notificaciones
- ✅ **Control de asistencia** - Notificaciones automáticas a padres
- 📋 **Tareas y actividades** - Subida de archivos, comentarios
- 💬 **Mensajería interna** - Comunicación entre usuarios
- 🔔 **Notificaciones en tiempo real** - Supabase Realtime
- 🔒 **Seguridad RLS** - Row Level Security por rol
- 📱 **Responsive** - Funciona en móvil, tablet y escritorio

## 🚀 Inicio Rápido

**¿Primera vez?** Lee [GETTING_STARTED.md](./GETTING_STARTED.md) para instrucciones paso a paso.

### Instalación Express

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.local.example .env.local

# 3. Editar .env.local con tus credenciales de Supabase
# Ver GETTING_STARTED.md para obtener credenciales

# 4. Configurar base de datos en Supabase
# Ejecutar: database/schema.sql
# Ejecutar: database/rls-policies.sql
# Ejecutar: database/triggers.sql

# 5. Iniciar desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
edusystem/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── auth/           # Autenticación
│   │   ├── dashboard/      # Dashboards por rol
│   │   ├── courses/        # Gestión de cursos
│   │   ├── grades/         # Sistema de calificaciones
│   │   ├── attendance/     # Control de asistencia
│   │   ├── tasks/          # Tareas y actividades
│   │   ├── messages/       # Mensajería
│   │   └── notifications/  # Notificaciones
│   ├── pages/              # Páginas por usuario
│   │   ├── auth/           # Login, registro
│   │   ├── teacher/        # Vistas de maestro
│   │   ├── student/        # Vistas de estudiante
│   │   ├── parent/         # Vistas de padre
│   │   └── admin/          # Vistas de administrador
│   ├── lib/                # Utilidades y configuración
│   │   ├── supabaseClient.js
│   │   └── helpers.js
│   ├── styles/             # Estilos CSS
│   ├── app.js              # Lógica principal de la app
│   └── main.js             # Punto de entrada
├── public/                 # Archivos estáticos
├── index.html             # HTML principal
├── vite.config.js         # Configuración de Vite
└── package.json
```

## 👥 Roles de Usuario

- **Maestro**: Gestiona cursos, calificaciones, asistencia y tareas
- **Estudiante**: Ve calificaciones, sube tareas, consulta asistencia
- **Padre**: Monitorea hijo (solo en escuelas), ve calificaciones y asistencia
- **Administrador**: Gestión completa del sistema

## 🛠️ Stack Tecnológico

- **Frontend**: Vite + Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Realtime**: Supabase Realtime
- **Storage**: Supabase Storage

## � Documentación

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Guía paso a paso para principiantes
- **[database/README.md](./database/README.md)** - Configuración de base de datos
- **[docs/SUPABASE_EDGE_FUNCTIONS.md](./docs/SUPABASE_EDGE_FUNCTIONS.md)** - Deploy de funciones administrativas
- **[TESTING.md](./TESTING.md)** - Cómo testear el sistema
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy a producción

## 📝 Estado del Proyecto

### ✅ Completado

- [x] Estructura del proyecto con Vite
- [x] Cliente Supabase configurado
- [x] Esquema completo de base de datos (14 tablas)
- [x] Políticas RLS por rol
- [x] Triggers automáticos (crear perfiles, notificaciones)
- [x] Sistema de autenticación (login, registro, recuperación)
- [x] Dashboards por rol (maestro, estudiante, padre, admin)
- [x] Navegación con sidebar
- [x] Sistema base de alertas y helpers

### 🚧 Por Implementar (Próximas Fases)

- [ ] Módulo completo de cursos (crear, editar, listar)
- [ ] Módulo de calificaciones (CRUD completo)
- [ ] Módulo de asistencia (toma de asistencia, reportes)
- [ ] Módulo de tareas (crear, subir, calificar)
- [ ] Sistema de notificaciones UI
- [ ] Mensajería interna UI
- [ ] Subida de archivos (Supabase Storage)
- [ ] Calendario de actividades
- [ ] Reportes y estadísticas
- [ ] Chatbot de asistencia

## 🎯 Cómo Contribuir

Este proyecto está estructurado para fácil extensión. Cada módulo vive en su propia carpeta:

```
src/components/
  ├── courses/        # Módulo de cursos
  ├── grades/         # Módulo de calificaciones
  ├── attendance/     # Módulo de asistencia
  └── tasks/          # Módulo de tareas
```

**Para agregar un módulo nuevo**:
1. Crea una carpeta en `src/components/`
2. Crea archivos JS que rendericen HTML dinámicamente
3. Conecta con Supabase usando el cliente en `src/lib/supabaseClient.js`
4. Respeta las políticas RLS - los datos se filtran automáticamente por rol

## 🔐 Seguridad

- ✅ Row Level Security (RLS) activo en todas las tablas
- ✅ Solo `anon key` expuesta en frontend
- ✅ Validación de inputs
- ✅ Políticas de acceso por rol
- ✅ Edge Functions para lógica sensible (próximamente)

## 🛠️ Scripts Disponibles

```bash
npm run dev       # Desarrollo (puerto 3000)
npm run build     # Build de producción
npm run preview   # Preview de build
```

## 💡 Arquitectura

- **Frontend**: Vite + Vanilla JS (sin frameworks pesados)
- **Backend**: Supabase (PostgreSQL gestionado)
- **Auth**: Supabase Auth con metadata de roles
- **Realtime**: Supabase Realtime para notificaciones
- **Storage**: Supabase Storage para archivos
- **Seguridad**: Row Level Security (RLS)

## 📄 Licencia

Proyecto académico - EduSystem 2026

---

**¿Listo para empezar?** → [GETTING_STARTED.md](./GETTING_STARTED.md)
