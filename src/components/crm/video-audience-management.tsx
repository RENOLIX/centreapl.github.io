'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Loader2, Search, Users } from 'lucide-react'

type Video = { id:string; title:string }
type Recipient = { id:string; full_name:string; email:string; role:'agent'|'supervisor' }

export function VideoAudienceManagement({ videos, recipients, initialRecipients }: { videos:Video[]; recipients:Recipient[]; initialRecipients:Record<string,string[]> }) {
  const [videoId, setVideoId] = useState(videos[0]?.id || '')
  const [selected, setSelected] = useState<string[]>(videos[0] ? initialRecipients[videos[0].id] || [] : [])
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const visible = useMemo(() => { const needle=search.trim().toLocaleLowerCase('fr'); return needle ? recipients.filter(user=>`${user.full_name} ${user.email} ${user.role}`.toLocaleLowerCase('fr').includes(needle)) : recipients }, [recipients,search])
  function chooseVideo(id:string){setVideoId(id);setSelected(initialRecipients[id]||[]);setMessage('')}
  function toggle(id:string){setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id])}
  async function save(event:FormEvent){event.preventDefault();if(!videoId||pending)return;setPending(true);setMessage('');try{const response=await fetch('/api/admin/help',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({videoId,recipientIds:selected})});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Enregistrement impossible');setMessage(`Diffusion enregistrée : ${selected.length} destinataire(s).`)}catch(error){setMessage(error instanceof Error?error.message:'Enregistrement impossible')}finally{setPending(false)}}
  if(!videos.length)return null
  return <section className="card p-6"><div className="flex gap-3"><Users className="text-emerald-600"/><div><h2 className="font-black">Afficher cette vidéo à</h2><p className="mt-1 text-sm text-slate-500">Choisissez une vidéo publiée, puis les agents et superviseurs autorisés.</p></div></div><form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm font-bold">Vidéo publiée<select value={videoId} onChange={event=>chooseVideo(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm">{videos.map(video=><option key={video.id} value={video.id}>{video.title}</option>)}</select></label><label className="relative block"><Search size={16} className="absolute left-3 top-10 text-slate-400"/><span className="text-sm font-bold">Rechercher un agent ou superviseur</span><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nom ou email…" className="mt-2 w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm"/></label><div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">{visible.map(person=><label key={person.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-slate-50"><input checked={selected.includes(person.id)} onChange={()=>toggle(person.id)} type="checkbox"/><span className="min-w-0"><span className="block truncate text-sm font-bold">{person.full_name}</span><span className="block truncate text-xs text-slate-500">{person.role==='agent'?'Agent':'Superviseur'} · {person.email}</span></span></label>)}{!visible.length&&<p className="text-sm text-slate-500">Aucun membre trouvé.</p>}</div>{message&&<p className={`text-sm font-bold ${message.includes('impossible')?'text-red-600':'text-emerald-700'}`}>{message}</p>}<button disabled={pending} className="btn btn-primary w-full justify-center disabled:opacity-50">{pending&&<Loader2 size={16} className="animate-spin"/>}{pending?'Enregistrement…':'Enregistrer la diffusion'}</button></form></section>
}
