'use client'
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function EmergencyActions({id}:{id:string}){const [pending,setPending]=useState(false);const router=useRouter();async function acknowledge(){setPending(true);const response=await fetch(`/api/emergencies/${id}`,{method:'PATCH'});setPending(false);if(response.ok)router.refresh()}return <button disabled={pending} onClick={()=>void acknowledge()} className="btn bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{pending?<Loader2 size={14} className="animate-spin"/>:<Check size={14}/>}Prise en charge</button>}
