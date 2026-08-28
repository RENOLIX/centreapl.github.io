import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/admin-auth'
import { AgentWorkstation } from '@/components/crm/agent-workstation'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type QueueClient = {
  assignment_id: string
  client_id: string
  campaign_id: string | null
  first_name: string
  last_name: string
  phone: string
  email: string
  city: string
  metadata: Record<string, unknown>
  campaign_name: string | null
  campaign_script: string | null
}

export default async function WorkPage() {
  const profile = await getCurrentProfile()
  if (profile?.role !== 'agent') redirect('/dashboard')

  const supabase = await createClient()
  const [{ data: queue, error: queueError }, { data: results }] = await Promise.all([
    supabase.rpc('claim_next_client'),
    supabase.from('call_results').select('id,label').eq('active', true).order('label'),
  ])
  const row = (queue?.[0] ?? null) as QueueClient | null

  if (queueError) {
    console.error('Agent queue error', queueError)
    return <div className="card grid min-h-80 place-items-center p-8 text-center"><div><AlertTriangle size={52} className="mx-auto text-amber-500"/><h1 className="mt-4 text-2xl font-black">File momentanément indisponible</h1><p className="mt-2 text-slate-500">La file de {profile.email} n’a pas pu être chargée. Réessayez dans quelques secondes.</p></div></div>
  }

  if (!row) {
    return <div className="card grid min-h-80 place-items-center p-8 text-center"><div><CheckCircle2 size={52} className="mx-auto text-emerald-500"/><h1 className="mt-4 text-2xl font-black">File terminée</h1><p className="mt-2 text-slate-500">Aucun client n’est affecté au compte {profile.email}.</p></div></div>
  }

  return <div className="space-y-4"><div><h1 className="text-xl font-black">Poste agent</h1><p className="text-sm text-slate-500">Un seul client à la fois · appel manuel uniquement.</p></div><AgentWorkstation client={{id:row.client_id,first_name:row.first_name,last_name:row.last_name,phone:row.phone,email:row.email,city:row.city,metadata:row.metadata,campaign_name:row.campaign_name,campaign_script:row.campaign_script}} results={results||[]}/></div>
}
