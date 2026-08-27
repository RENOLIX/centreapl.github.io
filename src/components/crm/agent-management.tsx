'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'

type TeamUser = { id: string; full_name: string; email: string; role: 'admin' | 'agent'; agents: { id: string; code: string; active: boolean }[] }

export function AgentManagement() {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
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
    setMessage('')
    const form = new FormData(event.currentTarget)
    const role = String(form.get('role'))
    const response = await fetch('/api/admin/agents', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: form.get('fullName'), email: form.get('email'), password: form.get('password'), role, code: role === 'agent' ? form.get('code') : undefined }) })
    const body = await response.json()
    if (!response.ok) return setMessage(body.error || 'Création impossible')
    event.currentTarget.reset()
    setMessage('Compte créé avec succès.')
    await load()
  }

  async function toggle(user: TeamUser) {
    const agent = user.agents?.[0]
    if (!agent) return
    const response = await fetch('/api/admin/agents', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: user.id, active: !agent.active }) })
    if (!response.ok) return setMessage('Modification impossible')
    await load()
  }

  return <section className="card p-6"><div className="flex items-center gap-3"><UserPlus className="text-amber-600"/><div><h2 className="font-black">Gestion de l’équipe</h2><p className="text-sm text-slate-500">Créez des administrateurs ou des agents authentifiés.</p></div></div><form onSubmit={createUser} className="mt-6 grid gap-3 md:grid-cols-2"><input name="fullName" required placeholder="Nom complet" className="rounded-xl border border-slate-200 p-3"/><input name="email" required type="email" placeholder="Email professionnel" className="rounded-xl border border-slate-200 p-3"/><input name="password" required minLength={8} type="password" placeholder="Mot de passe initial" className="rounded-xl border border-slate-200 p-3"/><input name="code" placeholder="Code agent, ex. AG001" className="rounded-xl border border-slate-200 p-3"/><select name="role" className="rounded-xl border border-slate-200 p-3"><option value="agent">Agent</option><option value="admin">Administrateur</option></select><button className="btn btn-primary justify-center">Créer le compte</button></form>{message&&<p className="mt-4 text-sm font-semibold text-amber-700">{message}</p>}<div className="mt-7 divide-y divide-slate-100">{loading&&<p className="py-5 text-sm text-slate-500">Chargement de l’équipe…</p>}{!loading&&!users.length&&<p className="py-5 text-sm text-slate-500">Aucun membre visible.</p>}{users.map(user=>{const agent=user.agents?.[0];return <div key={user.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{user.full_name}</p><p className="text-sm text-slate-500">{user.email} · {user.role==='admin'?'Administrateur':`Agent ${agent?.code||''}`}</p></div>{agent&&<button onClick={()=>void toggle(user)} className={`btn text-sm ${agent.active?'btn-ghost':'btn-primary'}`}>{agent.active?'Désactiver':'Activer'}</button>}</div>})}</div></section>
}
