# Guía de Configuración de Base de Datos - Supabase

## 📋 Pasos para configurar la base de datos

### 1. Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - Nombre: `edusystem`
   - Contraseña de base de datos: (guárdala en un lugar seguro)
   - Región: Selecciona la más cercana

### 2. Obtener credenciales

1. En el dashboard de Supabase, ve a **Settings** → **API**
2. Copia las siguientes credenciales:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public** key (VITE_SUPABASE_ANON_KEY)
3. Pégalas en tu archivo `.env.local`

### 3. Ejecutar el esquema de base de datos

1. En Supabase, ve a **SQL Editor**
2. Crea un nuevo query
3. Copia y pega el contenido de `database/schema.sql`
4. Ejecuta el query (botón "Run")
5. Verifica que no haya errores

### 4. Configurar políticas RLS (Row Level Security)

1. En el **SQL Editor**, crea otro query
2. Copia y pega el contenido de `database/rls-policies.sql`
3. Ejecuta el query
4. Verifica que las políticas se crearon correctamente

### 5. (Opcional) Insertar datos de prueba

1. En el **SQL Editor**, crea otro query
2. Copia y pega el contenido de `database/seed.sql`
3. Ejecuta el query

### 6. Configurar autenticación

1. Ve a **Authentication** → **Providers**
2. Habilita **Email** como método de autenticación
3. (Opcional) Configura otros proveedores como Google, GitHub, etc.

### 7. Configurar Storage (para archivos de tareas)

1. Ve a **Storage**
2. Crea un nuevo bucket llamado `task-files`
3. Configura las políticas de acceso:
   - Permitir a estudiantes subir archivos
   - Permitir a maestros leer archivos

## 🔧 Verificación

Para verificar que todo está configurado correctamente:

1. Ve a **Table Editor** en Supabase
2. Deberías ver todas las tablas creadas:
   - instituciones
   - profiles
   - students
   - courses
   - course_sections
   - schedules
   - enrollments
   - tasks
   - grades
   - attendance
   - notifications
   - messages
   - study_resources
   - study_recommendations

3. Ve a **Database** → **Policies**
4. Verifica que cada tabla tenga políticas RLS configuradas

## 📝 Crear primer usuario

### Opción 1: Desde la aplicación
1. Ejecuta `npm run dev`
2. Accede a la aplicación
3. Usa el formulario de registro (cuando esté implementado)

### Opción 2: Desde Supabase Dashboard
1. Ve a **Authentication** → **Users**
2. Click en "Add user"
3. Llena el formulario:
   - Email: admin@edusystem.com
   - Password: (tu contraseña)
   - User Metadata:
     ```json
     {
       "role": "admin",
       "nombre": "Administrador"
     }
     ```
4. Click en "Create new user"
5. El trigger automático creará el perfil en la tabla `profiles`

## 🔐 Seguridad

- **NUNCA** compartas tu `service_role` key públicamente
- Solo usa la `anon` key en el frontend
- Las políticas RLS protegen los datos según el rol
- Habilita 2FA en tu cuenta de Supabase

## 🚀 Próximos pasos

Una vez configurada la base de datos:
1. Actualiza tu archivo `.env.local` con las credenciales
2. Reinicia el servidor de desarrollo
3. Prueba el login con el usuario creado
4. Comienza a desarrollar los módulos

## ⚠️ Troubleshooting

### Error: "relation does not exist"
- Verifica que ejecutaste `schema.sql` completamente
- Revisa la consola de Supabase por errores

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS están configuradas
- Ejecuta `rls-policies.sql`

### No puedo hacer login
- Verifica que el usuario existe en **Authentication** → **Users**
- Verifica que el perfil se creó en la tabla `profiles`
- Revisa la consola del navegador por errores
