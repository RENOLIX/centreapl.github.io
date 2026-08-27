'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type Option = { id: string; label: string }

export function CampaignManagement({ campaigns, agents, clients }: { campaigns: Option[]; agents: Option[]; clients: Option[] }) {
  const router = useRouter()
  const [message, setMessage] = useState('')

  async function send(path: string, payload: object) {
    setMessage('')
    const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json()
    if (!response.ok) return setMessage(body.error || 'Opération impossible')
    setMessage('Enregistré.'); router.refresh()
  }

  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const element=event.currentTarget; const data=new FormData(element); await send('/api/campaigns',{name:data.get('name'),description:data.get('description')}); element.reset() }
  async function assign(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data=new FormData(event.currentTarget); await send('/api/campaigns/assign',{campaignId:data.get('campaignId'),agentId:data.get('agentId'),clientIds:data.getAll('clientIds')}) }

  return <div className="space-y-3"><div className="grid gap-3 lg:grid-cols-2"><details className="card p-4"><summary className="cursor-pointer font-bold">Créer une campagne</summary><form onSubmit={create} className="mt-4 space-y-3"><input required name="name" placeholder="Nom de la campagne" className="w-full rounded-xl border border-slate-200 p-3"/><textarea name="description" placeholder="Objectif / script de présentation" className="min-h-24 w-full rounded-xl border border-slate-200 p-3"/><button className="btn btn-primary w-full justify-center">Créer</button></form></details><details className="card p-4"><summary className="cursor-pointer font-bold">Affecter des clients</summary><form onSubmit={assign} className="mt-4 space-y-3"><select required name="campaignId" className="w-full rounded-xl border border-slate-200 p-3"><option value="">Choisir une campagne</option>{campaigns.map(campaign=><option key={campaign.id} value={campaign.id}>{campaign.label}</option>)}</select><select required name="agentId" className="w-full rounded-xl border border-slate-200 p-3"><option value="">Choisir un agent</option>{agents.map(agent=><option key={agent.id} value={agent.id}>{agent.label}</option>)}</select><select required multiple name="clientIds" className="min-h-32 w-full rounded-xl border border-slate-200 p-3">{clients.map(client=><option key={client.id} value={client.id}>{client.label}</option>)}</select><p className="text-xs text-slate-500">Ctrl/Cmd + clic pour sélectionner plusieurs clients.</p><button className="btn btn-primary w-full justify-center">Affecter</button></form></details></div>{message&&<p className="text-sm font-semibold text-amber-700">{message}</p>}</div>
}
