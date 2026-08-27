import Link from 'next/link'
import { CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CallbackActions } from '@/components/crm/callback-actions'

export const dynamic = 'force-dynamic'

type CallbackRow = {
  id: string
  scheduled_for: string
  note: string
  client: { id: string; first_name: string; last_name: string } | null
  agent: { user: { full_name: string } | null } | null
}

export default async function Callbacks() {
  let callbacks: CallbackRow[] = []
  let unavailable = false
  try {
    const supabase = await createClient()
    const result = await supabase
      .from('callbacks')
      .select('id,scheduled_for,note,client:clients(id,first_name,last_name),agent:agents(user:users(full_name))')
      .eq('status', 'scheduled')
      .gte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
    if (result.error) unavailable = true
    else callbacks = (result.data ?? []) as unknown as CallbackRow[]
  } catch {
    unavailable = true
  }

  return <div>
    <h1 className="text-2xl font-black">Rappels</h1>
    <p className="mt-1 text-sm text-slate-500">Les prochains contacts à effectuer manuellement.</p>
    <div className="card mt-6 divide-y divide-slate-100">
      {callbacks.map(callback => <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" key={callback.id}>
        <div>
          <p className="font-bold">{callback.client ? `${callback.client.first_name} ${callback.client.last_name}` : 'Client supprimé'}</p>
          <p className="mt-1 text-sm text-slate-500">{new Intl.DateTimeFormat('fr-DZ',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Algiers'}).format(new Date(callback.scheduled_for))}{callback.agent?.user?.full_name ? ` · ${callback.agent.user.full_name}` : ''}</p>
          {callback.note && <p className="mt-2 text-sm text-slate-600">{callback.note}</p>}
        </div>
        <div className="flex flex-wrap gap-2">{callback.client && <Link className="btn btn-primary text-sm" href={`/clients/${callback.client.id}`}>Ouvrir la fiche</Link>}<CallbackActions id={callback.id}/></div>
      </div>)}
      {!callbacks.length && <div className="flex flex-col items-center px-5 py-12 text-center">
        <CalendarClock className="text-slate-300" size={34}/>
        <p className="mt-3 font-bold">{unavailable ? 'Base CRM non connectée' : 'Aucun rappel programmé'}</p>
        <p className="mt-1 text-sm text-slate-500">{unavailable ? 'La configuration Supabase du déploiement est absente.' : 'Les rappels créés depuis les fiches clients apparaîtront ici.'}</p>
      </div>}
    </div>
  </div>
}
