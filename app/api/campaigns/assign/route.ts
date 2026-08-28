import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserManagement } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const input = await request.json() as { campaignId?: string; clientIds?: string[]; agentIds?: string[] }
  if (!input.campaignId || !input.clientIds?.length || !input.agentIds?.length) {
    return NextResponse.json({ error: 'Campagne, clients et agents requis' }, { status: 400 })
  }
  const supabase = await createClient()
  const {data,error}=await supabase.rpc('distribute_campaign_clients',{
    p_campaign_id:input.campaignId,
    p_client_ids:input.clientIds,
    p_agent_ids:input.agentIds,
  })
  return NextResponse.json(error ? { error: error.message } : { assigned: data }, { status: error ? 500 : 201 })
}
