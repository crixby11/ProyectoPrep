# Supabase Edge Functions

## Funcion: admin-reset-password

Esta funcion permite que un admin activo restablezca la contrasena de otro usuario desde el portal.

## Requisitos

- Supabase CLI instalada
- Proyecto enlazado con `supabase link`
- Secret `SUPABASE_SERVICE_ROLE_KEY` disponible en funciones (normalmente Supabase la inyecta)

## Deploy

```bash
supabase functions deploy admin-reset-password
```

## Probar local

```bash
supabase functions serve admin-reset-password --env-file .env.local
```

## Como lo usa el frontend

Desde la vista de usuarios se invoca:

- Funcion: `admin-reset-password`
- Body: `{ userId, tempPassword }`

La funcion valida:

1. Que el requester tenga sesion valida (JWT)
2. Que el requester sea admin activo en `profiles`
3. Que exista el usuario objetivo
4. Aplica `auth.admin.updateUserById` con la contrasena temporal

## Configuracion de gateway

La funcion incluye:

```toml
verify_jwt = false
```

Esto evita que el gateway rechace prematuramente la llamada y permite que la propia funcion valide el token del admin internamente.

## Seguridad

- Nunca expongas `service_role` en frontend.
- Esta funcion se ejecuta en backend (Edge Function), por eso es segura para operaciones admin de Auth.
