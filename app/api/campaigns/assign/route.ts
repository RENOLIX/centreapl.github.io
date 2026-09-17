import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserManagement } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const input = await request.json() as { campaignId?: string; folderId?: string; clientIds?: string[]; allFolder?:boolean; agentIds?: string[] }
  if (!input.campaignId || !input.folderId || (!input.allFolder && !input.clientIds?.length) || !input.agentIds?.length) {
    return NextResponse.json({ error: 'Campagne, dossier, clients et agents requis' }, { status: 400 })
  }
  const supabase = await createClient()
  let uniqueClientIds = [...new Set(input.clientIds||[])]
  if(input.allFolder){
    uniqueClientIds=[]
    for(let from=0;;from+=1000){
      let query=supabase.from('clients').select('id').order('id').range(from,from+999)
      query=input.folderId==='__unfiled__'?query.is('folder_id',null):query.eq('folder_id',input.folderId)
      const {data,error}=await query
      if(error)return NextResponse.json({error:error.message},{status:500})
      const page=data??[];uniqueClientIds.push(...page.map(row=>row.id))
      if(page.length<1000)break
    }
    if(!uniqueClientIds.length)return NextResponse.json({error:'Ce dossier ne contient aucun client.'},{status:400})
  }else{
    // Count server-side: returning rows here is capped by Supabase at 1,000 and falsely rejects large folders.
    let folderClients = supabase.from('clients').select('*', { count:'exact', head:true }).in('id', uniqueClientIds)
    folderClients = input.folderId === '__unfiled__' ? folderClients.is('folder_id', null) : folderClients.eq('folder_id', input.folderId)
    const { count: matchingCount, error: folderError } = await folderClients
    if (folderError || matchingCount !== uniqueClientIds.length) return NextResponse.json({ error: 'Un ou plusieurs clients ne font pas partie du dossier choisi.' }, { status: 400 })
  }
  const {data,error}=await supabase.rpc('distribute_campaign_clients',{
    p_campaign_id:input.campaignId,
    p_client_ids:uniqueClientIds,
    p_agent_ids:input.agentIds,
  })
  return NextResponse.json(error ? { error: error.message } : { assigned: data }, { status: error ? 500 : 201 })
}
