// @ts-nocheck

import { createClient } from 'npm:@supabase/supabase-js@2'

// Helper to decode base64url to string
function base64urlDecode(str: string): string {
  try {
    // Replace URL-safe characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding
    base64 = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    // Decode
    const binaryString = atob(base64)
    // Convert binary string to UTF-8 string
    return new TextDecoder().decode(
      Uint8Array.from(binaryString.charCodeAt.bind(binaryString), c => c)
    )
  } catch (e) {
    throw new Error(`Failed to decode base64url: ${e.message}`)
  }
}

// Helper to decode JWT payload
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payloadStr = base64urlDecode(parts[1])
    return JSON.parse(payloadStr)
  } catch (e) {
    console.error('Failed to decode JWT:', e.message)
    return null
  }
}

function jsonResponse(body: any, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    const body = await req.json()
    
    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization') || ''
    const requesterToken = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!requesterToken) {
      return jsonResponse({ success: false, error: 'Missing Authorization header' }, 401)
    }

    // Extract user ID from JWT token
    const payload = decodeJWT(requesterToken)
    if (!payload || !payload.sub) {
      return jsonResponse({ success: false, error: 'Invalid or expired token' }, 401)
    }

    const requesterId = payload.sub

    // Verify requester is admin
    const { data: requesterProfile, error: requesterError } = await adminClient
      .from('profiles')
      .select('rol, activo')
      .eq('id', requesterId)
      .single()

    if (requesterError || !requesterProfile) {
      return jsonResponse({ success: false, error: 'Requester profile not found' }, 403)
    }

    if (requesterProfile.rol !== 'admin' || requesterProfile.activo !== true) {
      return jsonResponse({ success: false, error: 'Only active admins can create users' }, 403)
    }

    // Extract user data
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '').trim()
    const rol = String(body?.rol || 'estudiante').trim()
    const primerNombre = String(body?.primer_nombre || '').trim()
    const segundoNombre = String(body?.segundo_nombre || '').trim()
    const apellidoPaterno = String(body?.apellido_paterno || '').trim()
    const apellidoMaterno = String(body?.apellido_materno || '').trim()
    const telefono = String(body?.telefono || '').trim()
    const fotoUrl = String(body?.foto_url || '').trim()
    const institucionId = body?.institucion_id ? String(body.institucion_id).trim() : null

    // Validation
    if (!email || !password) {
      return jsonResponse({ success: false, error: 'email and password are required' }, 400)
    }

    if (password.length < 8) {
      return jsonResponse({ success: false, error: 'Password must be at least 8 characters' }, 400)
    }

    if (!['admin', 'profesor', 'estudiante'].includes(rol)) {
      return jsonResponse({ success: false, error: 'Invalid rol' }, 400)
    }

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return jsonResponse({ success: false, error: 'User with this email already exists' }, 400)
    }

    // Create user in Supabase Auth with password
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (createError || !newUser?.user) {
      return jsonResponse({ success: false, error: createError?.message || 'Failed to create auth user' }, 500)
    }

    const userId = newUser.user.id

    // Create profile entry
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        email,
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        telefono,
        foto_url: fotoUrl,
        institucion_id: institucionId,
        rol,
        activo: true,
        // Legacy fields for compatibility
        nombre: primerNombre,
        apellido: apellidoPaterno,
        metadata: {}
      })
      .select()
      .single()

    if (profileError) {
      // Clean up auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(userId)
      return jsonResponse({ success: false, error: 'Failed to create user profile: ' + profileError.message }, 500)
    }

    return jsonResponse({
      success: true,
      user: profile,
      message: 'User created successfully'
    }, 200)

  } catch (error) {
    console.error('Error creating user:', error)
    return jsonResponse({
      success: false,
      error: error.message || 'Internal server error'
    }, 500)
  }
})
