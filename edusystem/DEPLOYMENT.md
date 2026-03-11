# 🚀 Guía de Deployment - EduSystem

## Preparación para Producción

### 1. Variables de Entorno

Crea un archivo `.env.production` con tus credenciales de producción:

```env
VITE_SUPABASE_URL=https://tu-proyecto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-produccion
```

### 2. Build de Producción

```bash
npm run build
```

Esto generará una carpeta `dist/` con los archivos optimizados.

### 3. Opciones de Deployment

## Opción A: Vercel (Recomendado - Gratis)

### Deployment automático desde GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Importa tu repositorio
4. Configura las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy automático

### Deployment manual

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Opción B: Netlify (Gratis)

1. Crea cuenta en [netlify.com](https://netlify.com)
2. Arrastra la carpeta `dist/` al dashboard
3. O conecta con GitHub para auto-deploy

### Configuración en `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Opción C: GitHub Pages

```bash
npm install -g gh-pages

# Agregar a package.json:
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

npm run deploy
```

## Opción D: Supabase Hosting

Supabase ofrece hosting gratuito para proyectos:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Deploy
supabase storage upload --project-ref tu-proyecto dist/
```

## Opción E: Servidor Propio (VPS)

### Con Nginx

```bash
# Copiar archivos
scp -r dist/* usuario@servidor:/var/www/edusystem/

# Configurar Nginx
sudo nano /etc/nginx/sites-available/edusystem
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/edusystem;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/edusystem /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📋 Checklist Pre-Deployment

- [ ] Todas las credenciales de producción están configuradas
- [ ] Las políticas RLS de Supabase están activas
- [ ] Se ejecutaron todos los scripts de base de datos (schema, policies, triggers)
- [ ] Se probó el login/registro en ambiente local
- [ ] Se configuró un dominio personalizado (opcional)
- [ ] Se configuró SSL/HTTPS
- [ ] Se probó en diferentes navegadores
- [ ] Se verificó la responsividad móvil

## 🔒 Seguridad en Producción

### Supabase

1. Habilita RLS en TODAS las tablas
2. Configura políticas de almacenamiento para archivos
3. Activa verificación de email obligatoria
4. Configura límites de rate limiting
5. Habilita 2FA en tu cuenta de Supabase

### Frontend

1. Nunca expongas `service_role` key
2. Solo usa `anon` key en el cliente
3. Valida datos en el frontend Y backend (edge functions)
4. Sanitiza inputs de usuario
5. Usa HTTPS siempre

## 🧪 Testing en Producción

1. Registrar cuenta de prueba
2. Probar flujo de estudiante completo
3. Probar flujo de maestro
4. Verificar notificaciones
5. Probar subida de archivos
6. Verificar permisos de cada rol

## 📊 Monitoreo

### Supabase Dashboard

- Database → Logs: Ver queries ejecutadas
- Auth → Users: Monitorear usuarios
- Storage → Usage: Ver consumo de almacenamiento

### Analytics (Opcional)

Agregar Google Analytics o similar:

```html
<!-- En index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=TU-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'TU-ID');
</script>
```

## 🔄 Actualizar Producción

### Vercel/Netlify

```bash
git add .
git commit -m "Nueva funcionalidad"
git push origin main
# Auto-deploy automático
```

### Manual

```bash
npm run build
# Subir archivos de dist/ a tu servidor
```

## 🐛 Troubleshooting

### Error: "Failed to fetch"
- Verifica que las credenciales de Supabase sean correctas
- Confirma que el proyecto de Supabase esté activo

### Error 404 en rutas
- Configura redirects correctamente (ver netlify.toml)
- En Nginx, asegúrate de tener `try_files`

### Estilos no se cargan
- Verifica que `base` esté configurado correctamente en `vite.config.js`
- Revisa las rutas de import en tu código

## 📧 Configurar Emails

### Supabase Email Templates

1. Ve a Authentication → Email Templates
2. Personaliza:
   - Confirm signup
   - Reset password
   - Magic link

Ejemplo:

```html
<h2>Bienvenido a EduSystem</h2>
<p>Haz click en el enlace para confirmar tu cuenta:</p>
<a href="{{ .ConfirmationURL }}">Confirmar cuenta</a>
```

## 🎯 Dominios Personalizados

### En Vercel

1. Settings → Domains
2. Agregar dominio
3. Configurar DNS según instrucciones

### En Netlify

1. Domain settings → Add custom domain
2. Actualizar registros DNS

DNS típico:
```
Type: A
Name: @
Value: (IP proporcionada)

Type: CNAME
Name: www
Value: tu-app.netlify.app
```

## 📱 PWA (Opcional)

Convertir en Progressive Web App:

```bash
npm install -D vite-plugin-pwa
```

Agregar a `vite.config.js`:

```js
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'EduSystem',
        short_name: 'EduSystem',
        description: 'Sistema de Gestión Académica',
        theme_color: '#667eea',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

## ✅ Post-Deployment

- [ ] Probar en producción con datos reales
- [ ] Configurar backups de base de datos
- [ ] Documentar proceso para equipo
- [ ] Configurar monitoreo de errores
- [ ] Entrenar usuarios finales
