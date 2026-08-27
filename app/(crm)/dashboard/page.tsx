import { CalendarClock, PhoneCall, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type AgentPerformance = {
  id: string
  code: string
  active: boolean
  users: { full_name: string; email: string } | null
  calls: { id: string; duration_seconds: number; call_results: { is_success: boolean; is_sale: boolean } | null }[]
  callbacks: { id: string; status: string }[]
}

const kpis = [['Clients actifs', Users], ['Appels effectués', PhoneCall], ['Appels réussis', TrendingUp], ['Rappels à venir', CalendarClock], ['Ventes', ShoppingCart]] as const

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const profile = auth.user ? await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle() : null
  const isAdmin = profile?.data?.role === 'admin'
  let values = [0, 0, 0, 0, 0]
  let performance: AgentPerformance[] = []

  try {
    const [clients, calls, successes, callbacks, sales, agents] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('calls').select('*', { count: 'exact', head: true }),
      supabase.from('calls').select('id,call_results!inner(is_success)', { count: 'exact', head: true }).eq('call_results.is_success', true),
      supabase.from('callbacks').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('calls').select('id,call_results!inner(is_sale)', { count: 'exact', head: true }).eq('call_results.is_sale', true),
      isAdmin ? supabase.from('agents').select('id,code,active,users!inner(full_name,email,role),calls(id,duration_seconds,call_results(is_success,is_sale)),callbacks(id,status)').eq('users.role', 'agent').order('created_at', { ascending: true }) : Promise.resolve({ data: [] }),
    ])
    values = [clients.count ?? 0, calls.count ?? 0, successes.count ?? 0, callbacks.count ?? 0, sales.count ?? 0]
    performance = (agents.data ?? []) as unknown as AgentPerformance[]
  } catch {}

  return <div className="space-y-7"><div><h1 className="text-2xl font-black tracking-tight">Vue d’ensemble</h1><p className="mt-1 text-sm text-slate-500">Données en temps réel depuis Supabase.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{kpis.map(([label, Icon], i)=><div className="card p-5" key={label}><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><Icon size={18} className="text-amber-600"/></div><p className="mt-4 text-3xl font-black">{values[i]}</p><p className="mt-1 text-xs font-semibold text-slate-500">Synchronisé Supabase</p></div>)}</section>{isAdmin&&<section className="card overflow-hidden"><div className="border-b border-slate-100 p-6"><h2 className="font-black">Performance des agents</h2><p className="mt-1 text-sm text-slate-500">Calculée uniquement depuis les activités enregistrées.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Agent</th><th className="p-4">Appels</th><th className="p-4">Réussis</th><th className="p-4">Ventes</th><th className="p-4">Rappels</th><th className="p-4">Durée</th><th className="p-4">État</th></tr></thead><tbody className="divide-y divide-slate-100">{performance.map(agent=>{const successful=agent.calls.filter(call=>call.call_results?.is_success).length;const sales=agent.calls.filter(call=>call.call_results?.is_sale).length;const callbacks=agent.callbacks.filter(callback=>callback.status==='scheduled').length;const duration=agent.calls.reduce((total,call)=>total+(call.duration_seconds||0),0);return <tr key={agent.id}><td className="p-4"><p className="font-bold">{agent.users?.full_name||agent.code}</p><p className="text-xs text-slate-500">{agent.code}</p></td><td className="p-4 font-semibold">{agent.calls.length}</td><td className="p-4 font-semibold">{successful}</td><td className="p-4 font-semibold">{sales}</td><td className="p-4 font-semibold">{callbacks}</td><td className="p-4">{Math.round(duration/60)} min</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${agent.active?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{agent.active?'Actif':'Inactif'}</span></td></tr>})}{!performance.length&&<tr><td colSpan={7} className="p-8 text-center text-slate-500">Aucun agent créé.</td></tr>}</tbody></table></div></section>}</div>
}
