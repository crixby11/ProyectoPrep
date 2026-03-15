// @ts-nocheck

import { createClient } from 'npm:@supabase/supabase-js@2'

// Helper to decode JWT payload
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    // Add padding if needed
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    // Decode base64url
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch {
    return null
  }
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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ success: false, error: 'Missing SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY' }, 500)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

    const body = await req.json()
    const accessToken = String(body?.accessToken || '').trim()
    const authHeader = req.headers.get('Authorization')
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim() || ''
    const requesterToken = accessToken || bearerToken

    if (!requesterToken) {
      return jsonResponse({ success: false, error: 'Missing access token' }, 401)
    }

    // Extract user ID from JWT token
    // Since verify_jwt = true, Supabase has already validated the JWT signature
    const payload = decodeJWT(requesterToken)
    if (!payload || !payload.sub) {
      return jsonResponse({ success: false, error: 'Invalid or expired token' }, 401)
    }
    
    const requesterId = payload.sub
    const { data: requesterProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('rol, activo')
      .eq('id', requesterId)
      .single()

    if (profileError || !requesterProfile) {
      return jsonResponse({ success: false, error: 'Requester profile not found' }, 403)
    }

    if (requesterProfile.rol !== 'admin' || requesterProfile.activo !== true) {
      return jsonResponse({ success: false, error: 'Only active admins can reset passwords' }, 403)
    }

    const userId = String(body?.userId || '').trim()
    const tempPassword = String(body?.tempPassword || '').trim()

    if (!userId || !tempPassword) {
      return jsonResponse({ success: false, error: 'userId and tempPassword are required' }, 400)
    }

    if (tempPassword.length < 8) {
      return jsonResponse({ success: false, error: 'Password must be at least 8 characters' }, 400)
    }

    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (targetError || !targetProfile) {
      return jsonResponse({ success: false, error: 'Target user not found' }, 404)
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: tempPassword
    })

    if (updateError) {
      return jsonResponse({ success: false, error: updateError.message }, 500)
    }

    return jsonResponse({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ success: false, error: message }, 500)
  }
})

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  })
}
