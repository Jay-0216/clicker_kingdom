import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      })
    }

    let body
    try { body = await req.json() } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const { id, user_id, nickname, clicks, battle_power, wins, title, last_online } = body

    // user_id must match the authenticated user (prevents impersonation)
    const effectiveUserId = user_id || id || user.id
    if (effectiveUserId !== user.id) {
      return new Response(JSON.stringify({ error: 'user_id mismatch: cannot impersonate another user' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!nickname) {
      return new Response(JSON.stringify({ error: 'Missing required field: nickname' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const clicksBig = BigInt(String(clicks ?? '0'))
    const maxClicks = BigInt('1' + '0'.repeat(60))
    if (clicksBig < 0n || clicksBig > maxClicks) {
      return new Response(JSON.stringify({ error: 'clicks out of range' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const bp = Number(battle_power ?? 0)
    if (bp < 0 || !Number.isFinite(bp) || bp > 1e60) {
      return new Response(JSON.stringify({ error: 'battle_power out of range' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      })
    }

    const { error: upsertError } = await supabaseAdmin
      .from('leaderboard')
      .upsert({
        id: user.id,
        nickname: String(nickname).slice(0, 20),
        clicks: String(clicksBig),
        battle_power: Math.floor(bp),
        wins: Math.max(0, Math.floor(Number(wins ?? 0))),
        title: String(title ?? '성주').slice(0, 30),
        last_online: last_online || new Date().toISOString()
      }, { onConflict: 'id' })

    if (upsertError) throw upsertError

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
})
