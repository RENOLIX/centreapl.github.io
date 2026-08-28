'use client'

import { FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Option = { id: string; label: string }

export function CampaignManagement({
  campaigns,
  clients,
  agents,
}: {
  campaigns: Option[]
  clients: Option[]
  agents: Option[]
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  function toggle(value: string, selected: string[], update: (values: string[]) => void) {
    update(selected.includes(value) ? selected.filter((id) => id !== value) : [...selected, value])
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setMessage('')
    const element = event.currentTarget
    const data = new FormData(element)
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: data.get('name'), description: data.get('description') }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Création impossible')
      element.reset()
      setMessage('Campagne créée.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Création impossible')
    } finally {
      setPending(false)
    }
  }

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    const campaignId = String(data.get('campaignId') || '')
    if (!campaignId || !selectedClients.length || !selectedAgents.length) {
      setMessage('Choisissez une campagne, au moins un client et au moins un agent.')
      return
    }

    setPending(true)
    setMessage('Distribution en cours…')
    try {
      const response = await fetch('/api/campaigns/assign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ campaignId, clientIds: selectedClients, agentIds: selectedAgents }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Distribution impossible')
      setMessage(`${body.assigned} client(s) réparti(s) entre ${selectedAgents.length} agent(s).`)
      setSelectedClients([])
      setSelectedAgents([])
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Distribution impossible')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <details className="card p-4">
          <summary className="cursor-pointer font-bold">Créer une campagne</summary>
          <form onSubmit={create} className="mt-4 space-y-3">
            <input required name="name" disabled={pending} placeholder="Nom de la campagne" className="w-full rounded-xl border border-slate-200 p-3" />
            <textarea name="description" disabled={pending} placeholder="Objectif / script de présentation" className="min-h-24 w-full rounded-xl border border-slate-200 p-3" />
            <button disabled={pending} className="btn btn-primary w-full justify-center disabled:opacity-60">
              {pending && <Loader2 size={16} className="animate-spin" />}Créer
            </button>
          </form>
        </details>

        <details className="card p-4" open>
          <summary className="cursor-pointer font-bold">Affecter des clients aux agents choisis</summary>
          <form onSubmit={assign} className="mt-4 space-y-4">
            <select required name="campaignId" disabled={pending} className="w-full rounded-xl border border-slate-200 p-3">
              <option value="">Choisir une campagne</option>
              {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.label}</option>)}
            </select>

            <fieldset disabled={pending}>
              <div className="mb-2 flex items-center justify-between">
                <legend className="text-sm font-black">1. Choisir les agents</legend>
                <button type="button" onClick={() => setSelectedAgents(selectedAgents.length === agents.length ? [] : agents.map((agent) => agent.id))} className="text-xs font-bold text-emerald-700">
                  {selectedAgents.length === agents.length && agents.length ? 'Tout retirer' : 'Tous les agents'}
                </button>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {agents.map((agent) => <label key={agent.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"><input type="checkbox" checked={selectedAgents.includes(agent.id)} onChange={() => toggle(agent.id, selectedAgents, setSelectedAgents)} /><span className="text-sm font-semibold">{agent.label}</span></label>)}
                {!agents.length && <p className="p-2 text-sm text-red-600">Aucun agent actif disponible.</p>}
              </div>
            </fieldset>

            <fieldset disabled={pending}>
              <div className="mb-2 flex items-center justify-between">
                <legend className="text-sm font-black">2. Choisir les clients</legend>
                <button type="button" onClick={() => setSelectedClients(selectedClients.length === clients.length ? [] : clients.map((client) => client.id))} className="text-xs font-bold text-emerald-700">
                  {selectedClients.length === clients.length && clients.length ? 'Tout retirer' : 'Tous les clients'}
                </button>
              </div>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {clients.map((client) => <label key={client.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50"><input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => toggle(client.id, selectedClients, setSelectedClients)} /><span className="text-sm">{client.label}</span></label>)}
                {!clients.length && <p className="p-2 text-sm text-slate-500">Aucun client disponible.</p>}
              </div>
            </fieldset>

            <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              {selectedClients.length} client(s) seront répartis équitablement entre {selectedAgents.length} agent(s).
            </p>
            <button disabled={pending || !selectedClients.length || !selectedAgents.length} className="btn btn-primary w-full justify-center disabled:opacity-50">
              {pending && <Loader2 size={16} className="animate-spin" />}
              Distribuer aux agents sélectionnés
            </button>
          </form>
        </details>
      </div>
      {message && <p className="text-sm font-semibold text-amber-700">{message}</p>}
    </div>
  )
}
