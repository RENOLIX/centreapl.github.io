import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function currentAgent() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return { supabase, agent: null }
  const { data: agent } = await supabase.from('agents').select('id,active').eq('user_id', auth.user.id).maybeSingle()
  return { supabase, agent: agent?.active ? agent : null }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params
  const input = await request.json() as { type?: 'note' | 'callback'; body?: string; scheduledFor?: string }
  const { supabase, agent } = await currentAgent()
  if (!agent) return NextResponse.json({ error: 'Compte agent actif requis' }, { status: 403 })
  const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client non affecté à cet agent' }, { status: 403 })
  if (input.type === 'note' && input.body?.trim()) {
    const { error } = await supabase.from('notes').insert({ client_id: clientId, agent_id: agent.id, body: input.body.trim() })
    return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 201 })
  }
  if (input.type === 'callback' && input.scheduledFor) {
    const date = new Date(input.scheduledFor)
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: 'Date invalide' }, { status: 400 })
    const { error } = await supabase.from('callbacks').insert({ client_id: clientId, agent_id: agent.id, scheduled_for: date.toISOString(), note: input.body?.trim() || '' })
    return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 201 })
  }
  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
