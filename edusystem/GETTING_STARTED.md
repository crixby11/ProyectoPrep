# 🎓 EduSystem - Inicio Rápido

¡Bienvenido a EduSystem! Sigue estos pasos para poner en marcha el sistema.

## 📋 Requisitos Previos

- Node.js 20+ instalado
- Cuenta en Supabase (gratis)
- Editor de código (VS Code recomendado)

## 🚀 Pasos de Instalación

### 1. Clonar/Descargar el Proyecto

Si ya tienes el proyecto localmente, continúa al paso 2.

### 2. Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
cd edusystem
npm install
```

### 3. Configurar Supabase

#### A. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta (es gratis)
3. Click en "New Project"
4. Rellena:
   - **Name**: `edusystem`
   - **Database Password**: Crea una contraseña fuerte (guárdala)
   - **Region**: Selecciona la más cercana
5. Click "Create new project" (toma ~2 minutos)

#### B. Obtener Credenciales

1. En el dashboard de Supabase, ve a **Settings** (⚙️) → **API**
2. Copia:
   - **Project URL** (aparece como `https://xxxxxx.supabase.co`)
   - **anon public** key (una clave larga)

#### C. Configurar Variables de Entorno

1. En la carpeta del proyecto, copia el archivo de ejemplo:
   ```bash
   cp .env.local.example .env.local
   ```

2. Abre `.env.local` y pega tus credenciales:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

### 4. Configurar Base de Datos

#### A. Ejecutar Schema (Crear Tablas)

1. En Supabase, ve a **SQL Editor** (icono </>)
2. Click "New query"
3. Abre el archivo `database/schema.sql` de este proyecto
4. Copia TODO su contenido
5. Pégalo en el editor de Supabase
6. Click **RUN** (o Ctrl+Enter)
7. Espera el mensaje de éxito ✅

#### B. Configurar Políticas de Seguridad (RLS)

1. En el mismo SQL Editor, click "New query"
2. Abre `database/rls-policies.sql`
3. Copia TODO su contenido
4. Pégalo en el editor
5. Click **RUN**
6. Verifica que no haya errores

#### C. Configurar Triggers Automáticos

1. Nueva query en SQL Editor
2. Abre `database/triggers.sql`
3. Copia y pega el contenido
4. Click **RUN**

#### D. (Opcional) Insertar Datos de Prueba

1. Nueva query
2. Abre `database/seed.sql`
3. Copia, pega y ejecuta

### 5. Configurar Autenticación

1. En Supabase, ve a **Authentication** → **Providers**
2. Asegúrate que **Email** esté habilitado (debe estar por defecto)
3. Ve a **URL Configuration**
4. En **Redirect URLs**, agrega: `http://localhost:3000`

### 6. ¡Iniciar la Aplicación!

```bash
npm run dev
```

La aplicación se abrirá en: **http://localhost:3000**

## 🎯 Primer Uso

### Crear tu Primera Cuenta

1. En la pantalla de login, click "Crear cuenta"
2. Rellena el formulario:
   - **Nombre**: Tu nombre completo
   - **Email**: Tu correo
   - **Tipo de cuenta**: Selecciona Estudiante (para probar)
   - **Contraseña**: Mínimo 6 caracteres
3. Click "Crear Cuenta"

### Verificar Email

1. Revisa tu correo (puede tardar 1-2 minutos)
2. Click en el enlace de verificación
3. Regresa a la app y haz login

### Explorar el Dashboard

¡Listo! Ahora puedes explorar el sistema según tu rol.

## 📚 Siguiente Paso: Crear Datos Iniciales

### Opción A: Datos Manuales

1. Ve a Supabase → **Table Editor**
2. Crea instituciones, cursos, etc. manualmente

### Opción B: Usar SQL de Prueba

Ejecuta `database/seed.sql` para tener datos de ejemplo.

## 🔧 Comandos Útiles

```bash
# Iniciar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## ❓ Problemas Comunes

### "Cannot find module '@supabase/supabase-js'"

**Solución**: Ejecuta `npm install`

### "Invalid API key"

**Solución**: 
1. Verifica que copiaste bien las credenciales en `.env.local`
2. Reinicia el servidor (`Ctrl+C` y luego `npm run dev`)

### "relation does not exist"

**Solución**: Asegúrate de ejecutar `database/schema.sql` en Supabase

### No puedo hacer login

**Solución**:
1. Verifica que tu email esté verificado
2. Revisa la consola del navegador (F12) por errores
3. Ve a Supabase → **Authentication** → **Users** y verifica que existe tu usuario

### Página en blanco

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Verifica que `.env.local` exista y tenga las credenciales correctas

## 📖 Documentación Adicional

- **[README.md](./README.md)**: Descripción general del proyecto
- **[database/README.md](./database/README.md)**: Guía detallada de base de datos
- **[TESTING.md](./TESTING.md)**: Cómo testear el sistema
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Cómo deployar a producción

## 🆘 ¿Necesitas Ayuda?

1. Revisa los archivos de documentación mencionados arriba
2. Revisa la consola del navegador (F12) por errores
3. Revisa los logs de Supabase (**Database** → **Logs**)

## ✅ Checklist de Verificación

- [ ] Node.js instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Proyecto de Supabase creado
- [ ] Credenciales en `.env.local`
- [ ] Schema ejecutado (`schema.sql`)
- [ ] Políticas RLS ejecutadas (`rls-policies.sql`)
- [ ] Triggers ejecutados (`triggers.sql`)
- [ ] Email provider habilitado en Supabase
- [ ] Aplicación corriendo (`npm run dev`)
- [ ] Primera cuenta creada y verificada

## 🎉 ¡Listo!

Ahora puedes empezar a desarrollar módulos adicionales o personalizar el sistema según tus necesidades.

**Próximos pasos recomendados**:
1. Familiarízate con la estructura del proyecto
2. Crea algunos cursos de prueba
3. Prueba el sistema con diferentes roles (estudiante, maestro, padre)
4. Lee el archivo [TESTING.md](./TESTING.md) para probar funcionalidades

¡Disfruta construyendo con EduSystem! 🎓
