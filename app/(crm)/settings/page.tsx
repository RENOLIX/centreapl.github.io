import Link from 'next/link'
import { ShieldCheck, UserRound, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AgentManagement } from '@/components/crm/agent-management'
import { getCurrentRole } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  if(await getCurrentRole()!=='admin')redirect('/dashboard')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const authUser = authData.user

  if (!authUser) {
    return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-black">Paramètres</h1><p className="mt-1 text-sm text-slate-500">Votre session a expiré.</p></div><section className="card p-6"><p className="font-bold">Connexion requise</p><p className="mt-2 text-sm text-slate-500">Reconnectez-vous pour consulter les paramètres sécurisés du CRM.</p><Link className="btn btn-primary mt-5" href="/login">Se connecter</Link></section></div>
  }

  const [profileResult, agentsResult] = await Promise.all([
    supabase.from('users').select('email,full_name,role').eq('id', authUser.id).maybeSingle(),
    supabase.from('agents').select('*', { count: 'exact', head: true }),
  ])

  const profile = profileResult.data
  const name = profile?.full_name || authUser.user_metadata?.full_name || 'Compte CRM'
  const email = profile?.email || authUser.email || 'Non renseigné'
  const role = profile?.role || authUser.user_metadata?.role || 'Utilisateur'
  const agentsCount = agentsResult.count

  return <div className="mx-auto max-w-4xl space-y-6"><div><h1 className="text-2xl font-black">Paramètres</h1><p className="mt-1 text-sm text-slate-500">Informations réelles du compte et de la connexion Supabase.</p></div><section className="grid gap-4 md:grid-cols-3"><div className="card p-5"><UserRound className="text-amber-600" size={21}/><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Compte</p><p className="mt-1 font-black">{name}</p><p className="mt-1 break-all text-sm text-slate-500">{email}</p></div><div className="card p-5"><ShieldCheck className="text-emerald-600" size={21}/><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Rôle</p><p className="mt-1 font-black capitalize">{role}</p><p className="mt-1 text-sm text-slate-500">Session protégée par Supabase Auth</p></div><div className="card p-5"><Users className="text-sky-600" size={21}/><p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Agents visibles</p><p className="mt-1 font-black">{agentsCount ?? 'Accès limité'}</p><p className="mt-1 text-sm text-slate-500">Résultat soumis aux politiques RLS</p></div></section>{role==='admin'&&<AgentManagement/>}<section className="card p-6"><h2 className="font-black">Sécurité des données</h2><p className="mt-2 text-sm leading-6 text-slate-500">Le CRM utilise le projet Supabase Centre d’appel Atlas Miel. Les agents ne peuvent consulter que les données autorisées par les politiques Row Level Security.</p></section></div>
}
