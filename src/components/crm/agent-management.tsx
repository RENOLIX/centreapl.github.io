'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Loader2, Trash2, UserPlus } from 'lucide-react'

type TeamUser = { id: string; full_name: string; email: string; role: 'admin' | 'supervisor' | 'agent'; agents: { id: string; code: string; active: boolean }[] }

export function AgentManagement() {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/admin/agents', { cache: 'no-store' })
    const body = await response.json()
    setMessage(response.ok ? '' : body.error || 'Chargement impossible')
    setUsers(body.users || [])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creating) return
    setCreating(true)
    setMessage('')
    const form = new FormData(event.currentTarget)
    const role = String(form.get('role'))
    try {
      const response = await fetch('/api/admin/agents', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: form.get('fullName'), email: form.get('email'), password: form.get('password'), role, code: role === 'agent' ? form.get('code') : undefined }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Création impossible')
      setUsers((current) => [body.user, ...current.filter((user) => user.id !== body.user.id)])
      event.currentTarget.reset()
      setMessage('Compte créé avec succès. Il est déjà visible dans la liste.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Création impossible')
    } finally {
      setCreating(false)
    }
  }

  async function toggle(user: TeamUser) {
    const agent = user.agents?.[0]
    if (!agent) return
    const response = await fetch('/api/admin/agents', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: user.id, active: !agent.active }) })
    if (!response.ok) return setMessage('Modification impossible')
    await load()
  }

  async function remove(user:TeamUser){if(!window.confirm(`Supprimer le compte de ${user.full_name} ? L’historique d’appels sera conservé.`))return;const response=await fetch('/api/admin/agents',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({userId:user.id})});const body=await response.json();if(!response.ok)return setMessage(body.error||'Suppression impossible');setMessage('Compte supprimé.');await load()}

  return <section className="card p-6"><div className="flex items-center gap-3"><UserPlus className="text-amber-600"/><div><h2 className="font-black">Gestion de l’équipe</h2><p className="text-sm text-slate-500">Créez des administrateurs, superviseurs ou agents.</p></div></div><form onSubmit={createUser} className="mt-6 grid gap-3 md:grid-cols-2"><input name="fullName" required disabled={creating} placeholder="Nom complet" className="rounded-xl border border-slate-200 p-3"/><input name="email" required disabled={creating} type="email" placeholder="Email professionnel" className="rounded-xl border border-slate-200 p-3"/><input name="password" required disabled={creating} minLength={8} type="password" placeholder="Mot de passe initial" className="rounded-xl border border-slate-200 p-3"/><input name="code" disabled={creating} placeholder="Code agent, ex. AG001" className="rounded-xl border border-slate-200 p-3"/><select name="role" disabled={creating} className="rounded-xl border border-slate-200 p-3"><option value="agent">Agent</option><option value="supervisor">Superviseur</option><option value="admin">Administrateur</option></select><button disabled={creating} className="btn btn-primary justify-center disabled:opacity-60">{creating&&<Loader2 size={16} className="animate-spin"/>}{creating?'Création…':'Créer le compte'}</button></form>{message&&<p className="mt-4 text-sm font-semibold text-amber-700">{message}</p>}<div className="mt-7 divide-y divide-slate-100">{loading&&<p className="py-5 text-sm text-slate-500">Chargement de l’équipe…</p>}{!loading&&!users.length&&<p className="py-5 text-sm text-slate-500">Aucun membre visible.</p>}{users.map(user=>{const agent=user.agents?.[0];return <div key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{user.full_name}</p><p className="text-sm text-slate-500">{user.email} · {user.role==='admin'?'Administrateur':user.role==='supervisor'?'Superviseur':`Agent ${agent?.code||''}`}</p></div><div className="flex gap-2">{agent&&<button onClick={()=>void toggle(user)} className={`btn text-sm ${agent.active?'btn-ghost':'btn-primary'}`}>{agent.active?'Désactiver':'Activer'}</button>}<button onClick={()=>void remove(user)} className="btn border border-red-200 bg-red-50 text-sm text-red-700"><Trash2 size={15}/>Supprimer</button></div></div>})}</div></section>
}
