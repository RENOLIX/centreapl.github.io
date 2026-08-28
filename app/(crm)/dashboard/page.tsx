import { CheckCircle2, Clock3, Contact, Headphones, Megaphone, PhoneCall, ShoppingCart, UsersRound, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DashboardLiveRefresh } from '@/components/crm/dashboard-live-refresh'

export const dynamic = 'force-dynamic'

type AgentPerformance = {
  id: string
  code: string
  active: boolean
  last_seen_at: string | null
  users: { full_name: string; email: string } | null
  calls: { id: string; duration_seconds: number; call_results: { is_success: boolean; is_sale: boolean } | null }[]
  callbacks: { id: string; status: string }[]
}
type Campaign = { id: string; name: string; active: boolean; client_assignments: { id: string }[] }

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const profile = auth.user ? await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle() : null
  const role = profile?.data?.role as 'admin' | 'supervisor' | 'agent' | undefined
  const isManagement = role === 'admin' || role === 'supervisor'
  let values = [0, 0, 0, 0, 0]
  let performance: AgentPerformance[] = []
  let campaigns: Campaign[] = []

  try {
    const [clients, calls, successes, callbacks, sales, agents, campaignRows] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('calls').select('*', { count: 'exact', head: true }),
      supabase.from('calls').select('id,call_results!inner(is_success)', { count: 'exact', head: true }).eq('call_results.is_success', true),
      supabase.from('callbacks').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('calls').select('id,call_results!inner(is_sale)', { count: 'exact', head: true }).eq('call_results.is_sale', true),
      isManagement ? supabase.from('agents').select('id,code,active,last_seen_at,users!inner(full_name,email,role),calls(id,duration_seconds,call_results(is_success,is_sale)),callbacks(id,status)').eq('users.role', 'agent').order('created_at', { ascending: true }) : Promise.resolve({ data: [] }),
      supabase.from('campaigns').select('id,name,active,client_assignments(id)').eq('active', true).order('created_at', { ascending: false }).limit(5),
    ])
    values = [clients.count ?? 0, calls.count ?? 0, successes.count ?? 0, callbacks.count ?? 0, sales.count ?? 0]
    performance = (agents.data ?? []) as unknown as AgentPerformance[]
    campaigns = (campaignRows.data ?? []) as unknown as Campaign[]
  } catch {}

  const [clientsCount, callsCount, successCount, callbackCount, salesCount] = values
  const unsuccessful = Math.max(0, callsCount - successCount)
  const successRate = callsCount ? Math.round(successCount / callsCount * 100) : 0
  const onlineCutoff = Date.now() - 120_000
  const isOnline = (agent: AgentPerformance) => agent.active && Boolean(agent.last_seen_at) && new Date(agent.last_seen_at!).getTime() >= onlineCutoff
  const onlineAgents = performance.filter(isOnline).length

  let ownPauseMinutes = 0
  if (role === 'agent' && auth.user) {
    const { data: agent } = await supabase.from('agents').select('id').eq('user_id', auth.user.id).maybeSingle()
    if (agent) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const { data: pauses } = await supabase.from('pause_sessions').select('started_at,ended_at').eq('agent_id', agent.id).gte('started_at', today.toISOString())
      ownPauseMinutes = Math.floor((pauses ?? []).reduce((total, row) => total + Math.max(0, new Date(row.ended_at || Date.now()).getTime() - new Date(row.started_at).getTime()), 0) / 60000)
    }
  }

  const tiles = [
    { label: 'Contacts accessibles', value: clientsCount, Icon: Contact, color: '#673ab7' },
    { label: 'Appels terminés enregistrés', value: callsCount, Icon: PhoneCall, color: '#7447c8' },
    { label: 'Rappels programmés', value: callbackCount, Icon: Clock3, color: '#009688' },
    { label: 'Appels réussis', value: successCount, Icon: CheckCircle2, color: '#16a9d5' },
    { label: 'Ventes enregistrées', value: salesCount, Icon: ShoppingCart, color: '#18a8ce' },
    { label: 'Sans succès', value: unsuccessful, Icon: XCircle, color: '#049b89' },
  ]
  if (role === 'agent') tiles.push({ label: 'Pause aujourd’hui', value: ownPauseMinutes, Icon: Clock3, color: '#ef6c00' })

  return <div className="space-y-4">
    {isManagement && <DashboardLiveRefresh />}
    <div className="border-b border-slate-300 pb-3"><h1 className="text-xl font-normal text-slate-600">Dashboard</h1><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">Données réelles · historique des appels terminés</p></div>
    <div className="grid gap-3 xl:grid-cols-12">
      <div className="space-y-3 xl:col-span-9">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tiles.map(({ label, value, Icon, color }) => <div key={label} className="flex min-h-24 overflow-hidden border border-black/5 text-white shadow-sm" style={{ backgroundColor: color }}><div className="grid w-16 shrink-0 place-items-center border-r border-white/15 bg-black/5"><Icon size={30} strokeWidth={1.5}/></div><div className="flex flex-1 flex-col justify-center px-4"><p className="text-3xl font-light leading-none">{value}</p><p className="mt-2 text-[11px] text-white/85">{label}</p></div></div>)}</section>
        <section className="card"><div className="panel-title">État du centre</div><div className="grid gap-px bg-slate-200 sm:grid-cols-3"><div className="flex items-center gap-4 bg-white p-5"><div className="grid h-12 w-12 place-items-center bg-[#ef5350] text-white"><Headphones size={25}/></div><div><p className="text-2xl font-light">{onlineAgents}</p><p className="text-[11px] text-slate-500">Agents en ligne maintenant</p></div></div><div className="flex items-center gap-4 bg-white p-5"><div className="grid h-12 w-12 place-items-center bg-[#009688] text-white"><UsersRound size={25}/></div><div><p className="text-2xl font-light">{performance.length}</p><p className="text-[11px] text-slate-500">Agents enregistrés</p></div></div><div className="flex items-center gap-4 bg-white p-5"><div className="grid h-12 w-12 place-items-center bg-[#ff7f24] text-white"><Megaphone size={25}/></div><div><p className="text-2xl font-light">{campaigns.length}</p><p className="text-[11px] text-slate-500">Campagnes actives</p></div></div></div></section>
        <section className="card"><div className="panel-title">Activité des agents</div><div className="space-y-4 p-5">{performance.map(agent => { const maximum = Math.max(1, ...performance.map(item => item.calls.length)); const percent = Math.round(agent.calls.length / maximum * 100); return <div key={agent.id} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-xs"><span className="truncate font-semibold text-slate-600">{agent.users?.full_name || agent.code}</span><div className="h-2 bg-slate-100"><div className="h-full bg-[#1db69a]" style={{ width: `${percent}%` }}/></div><span className="text-right text-slate-500">{agent.calls.length}</span></div>})}{!performance.length && <p className="py-8 text-center text-xs text-slate-400">Aucune activité agent enregistrée.</p>}</div></section>
      </div>
      <aside className="space-y-3 xl:col-span-3">
        <section className="card grid grid-cols-2"><div className="bg-[#18a58f] p-4 text-white"><p className="text-[10px] uppercase text-white/70">Aujourd’hui</p><p className="mt-2 text-2xl font-light">{new Intl.DateTimeFormat('fr-DZ', { day: '2-digit', month: 'short' }).format(new Date())}</p></div><div className="p-4"><p className="text-[10px] uppercase text-slate-400">Heure locale</p><p className="mt-2 text-xl font-light text-slate-600">{new Intl.DateTimeFormat('fr-DZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Algiers' }).format(new Date())}</p></div></section>
        <section className="card"><div className="panel-title">Taux de réussite des appels terminés</div><div className="grid place-items-center px-4 py-7"><div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: `conic-gradient(#20b99a ${successRate * 3.6}deg,#e8edf0 0)` }}><div className="grid h-24 w-24 place-items-center rounded-full bg-white"><div className="text-center"><p className="text-2xl font-light text-slate-600">{successRate}%</p><p className="text-[9px] uppercase text-slate-400">Réussite</p></div></div></div><p className="mt-4 text-center text-[11px] text-slate-400">{successCount} réussi(s) parmi {callsCount} appel(s) terminés et enregistrés</p></div></section>
        <section className="card"><div className="panel-title">Campagnes actives</div><div className="divide-y divide-slate-100">{campaigns.map((campaign, index) => <div key={campaign.id} className="flex items-center gap-3 p-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-500 text-[10px] font-bold text-white">{index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-600">{campaign.name}</p><p className="text-[10px] text-slate-400">{campaign.client_assignments.length} contact(s)</p></div></div>)}{!campaigns.length && <p className="p-5 text-center text-xs text-slate-400">Aucune campagne active.</p>}</div></section>
      </aside>
    </div>
    {isManagement && <section className="card overflow-hidden"><div className="panel-title">Performance des agents uniquement</div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#f6f8f9] text-[10px] uppercase text-slate-500"><tr><th className="p-3">Agent</th><th className="p-3">Appels</th><th className="p-3">Réussis</th><th className="p-3">Ventes</th><th className="p-3">Rappels</th><th className="p-3">Durée</th><th className="p-3">Présence</th></tr></thead><tbody className="divide-y divide-slate-100">{performance.map(agent => { const successful = agent.calls.filter(call => call.call_results?.is_success).length; const sales = agent.calls.filter(call => call.call_results?.is_sale).length; const callbacks = agent.callbacks.filter(callback => callback.status === 'scheduled').length; const duration = agent.calls.reduce((total, call) => total + (call.duration_seconds || 0), 0); const online = isOnline(agent); const state = !agent.active ? 'Désactivé' : online ? 'En ligne' : 'Hors ligne'; return <tr key={agent.id} className="hover:bg-slate-50"><td className="p-3"><p className="font-bold text-slate-700">{agent.users?.full_name || agent.code}</p><p className="text-[10px] text-slate-400">{agent.code}</p></td><td className="p-3">{agent.calls.length}</td><td className="p-3">{successful}</td><td className="p-3">{sales}</td><td className="p-3">{callbacks}</td><td className="p-3">{Math.round(duration / 60)} min</td><td className="p-3"><span className={`px-2 py-1 text-[10px] font-bold ${online ? 'bg-emerald-50 text-emerald-700' : !agent.active ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{state}</span></td></tr>})}{!performance.length && <tr><td colSpan={7} className="p-8 text-center text-slate-400">Aucun agent créé.</td></tr>}</tbody></table></div></section>}
  </div>
}
