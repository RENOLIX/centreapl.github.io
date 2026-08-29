'use client'
import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

export function EmergencyButton(){
  const [pending,setPending]=useState(false);const [message,setMessage]=useState('')
  async function send(){if(pending||!window.confirm('Envoyer maintenant une alerte urgente à votre superviseur ?'))return;setPending(true);setMessage('');const response=await fetch('/api/emergencies',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});const body=await response.json();setPending(false);setMessage(response.ok?'Alerte urgente envoyée au superviseur.':body.error||'Envoi impossible')}
  return <div className="mt-4"><button type="button" disabled={pending} onClick={()=>void send()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:opacity-60">{pending?<Loader2 size={19} className="animate-spin"/>:<AlertTriangle size={19}/>}Urgence superviseur</button>{message&&<p className={`mt-2 text-center text-xs font-bold ${message.includes('envoyée')?'text-emerald-700':'text-red-600'}`}>{message}</p>}</div>
}
