import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const input = await request.json() as { campaignId?: string; agentId?: string; clientIds?: string[] }
  if (!input.campaignId || !input.agentId || !input.clientIds?.length) return NextResponse.json({ error: 'Campagne, agent et clients requis' }, { status: 400 })
  const supabase = await createClient()
  const rows = input.clientIds.map(clientId => ({ campaign_id: input.campaignId, agent_id: input.agentId, client_id: clientId, status: 'active' as const }))
  await supabase.from('client_assignments').delete().eq('campaign_id', input.campaignId).eq('agent_id', input.agentId).in('client_id', input.clientIds)
  const { error } = await supabase.from('client_assignments').insert(rows)
  return NextResponse.json(error ? { error: error.message } : { assigned: rows.length }, { status: error ? 500 : 201 })
}
