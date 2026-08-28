'use client'

import { useState } from 'react'
import { Loader2, Save, UsersRound } from 'lucide-react'

type Person={id:string;name:string;email:string}
type Agent=Person&{code:string}

export function TeamAssignment({supervisors,agents,initial}:{supervisors:Person[];agents:Agent[];initial:Record<string,string[]>}){
  const [selectedSupervisor,setSelectedSupervisor]=useState(supervisors[0]?.id||'')
  const [teams,setTeams]=useState(initial)
  const [pending,setPending]=useState(false)
  const [message,setMessage]=useState('')
  const selected=teams[selectedSupervisor]||[]
  function toggle(id:string){setTeams(current=>({...current,[selectedSupervisor]:selected.includes(id)?selected.filter(value=>value!==id):[...selected,id]}))}
  async function save(){if(!selectedSupervisor||pending)return;setPending(true);setMessage('');const response=await fetch('/api/admin/teams',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({supervisorId:selectedSupervisor,agentIds:selected})});const body=await response.json();setPending(false);setMessage(response.ok?`Équipe enregistrée : ${body.saved} agent(s).`:body.error||'Enregistrement impossible')}
  return <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
    <section className="card p-4"><h2 className="font-black">Superviseurs</h2><div className="mt-3 space-y-2">{supervisors.map(person=><button key={person.id} onClick={()=>setSelectedSupervisor(person.id)} className={`w-full rounded-xl border p-3 text-left ${selectedSupervisor===person.id?'border-emerald-500 bg-emerald-50':'border-slate-200'}`}><p className="font-bold">{person.name}</p><p className="text-xs text-slate-500">{person.email}</p></button>)}{!supervisors.length&&<p className="text-sm text-slate-500">Créez d’abord un compte superviseur.</p>}</div></section>
    <section className="card p-5"><div className="flex items-center gap-3"><UsersRound className="text-emerald-600"/><div><h2 className="font-black">Agents de son équipe</h2><p className="text-sm text-slate-500">Le superviseur ne verra que les données des agents cochés.</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{agents.map(agent=><label key={agent.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"><input type="checkbox" checked={selected.includes(agent.id)} onChange={()=>toggle(agent.id)}/><span><span className="block font-bold">{agent.name}</span><span className="text-xs text-slate-500">{agent.email} · {agent.code}</span></span></label>)}</div><button onClick={()=>void save()} disabled={!selectedSupervisor||pending} className="btn btn-primary mt-5 w-full justify-center disabled:opacity-50">{pending?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Enregistrer l’équipe</button>{message&&<p className="mt-3 text-sm font-bold text-amber-700">{message}</p>}</section>
  </div>
}
