import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserManagement } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const input = await request.json() as { campaignId?: string; folderId?: string; clientIds?: string[]; agentIds?: string[] }
  if (!input.campaignId || !input.folderId || !input.clientIds?.length || !input.agentIds?.length) {
    return NextResponse.json({ error: 'Campagne, dossier, clients et agents requis' }, { status: 400 })
  }
  const supabase = await createClient()
  const uniqueClientIds = [...new Set(input.clientIds)]
  let folderClients = supabase.from('clients').select('id').in('id', uniqueClientIds)
  folderClients = input.folderId === '__unfiled__' ? folderClients.is('folder_id', null) : folderClients.eq('folder_id', input.folderId)
  const { data: matchingClients, error: folderError } = await folderClients
  if (folderError || matchingClients?.length !== uniqueClientIds.length) {
    return NextResponse.json({ error: 'Un ou plusieurs clients ne font pas partie du dossier choisi.' }, { status: 400 })
  }
  const {data,error}=await supabase.rpc('distribute_campaign_clients',{
    p_campaign_id:input.campaignId,
    p_client_ids:uniqueClientIds,
    p_agent_ids:input.agentIds,
  })
  return NextResponse.json(error ? { error: error.message } : { assigned: data }, { status: error ? 500 : 201 })
}
