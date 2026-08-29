'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Status='pending'|'confirmed'|'cancelled'
export function SaleStatusActions({id,current}:{id:string;current:Status}){const [pending,setPending]=useState(false);const [message,setMessage]=useState('');const router=useRouter();async function update(status:Status){if(pending||status===current)return;setPending(true);setMessage('');const response=await fetch(`/api/sales/${id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status})});const body=await response.json();setPending(false);if(!response.ok){setMessage(body.error||'Modification impossible');return}router.refresh()}return <div><select value={current} disabled={pending} onChange={event=>void update(event.target.value as Status)} className="min-w-32 rounded-lg border border-slate-200 bg-white p-2 text-xs font-bold"><option value="pending">À confirmer</option><option value="confirmed">Confirmée</option><option value="cancelled">Annulée</option></select>{pending&&<Loader2 size={14} className="ml-2 inline animate-spin"/>}{message&&<p className="mt-1 text-[10px] font-bold text-red-600">{message}</p>}</div>}
