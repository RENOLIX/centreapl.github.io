'use client'
import { useRouter } from 'next/navigation'

export function CallbackActions({id}:{id:string}){
  const router=useRouter()
  async function setStatus(status:'completed'|'cancelled'){const response=await fetch(`/api/callbacks/${id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status})});if(response.ok)router.refresh()}
  return <div className="flex gap-2"><button onClick={()=>setStatus('completed')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Terminé</button><button onClick={()=>setStatus('cancelled')} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">Annuler</button></div>
}
