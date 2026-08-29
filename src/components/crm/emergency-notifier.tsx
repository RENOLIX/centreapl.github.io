'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

type Alert={id:string;agent_name:string;agent_code:string;message:string;created_at:string}
export function EmergencyNotifier({userId,role}:{userId:string;role:'admin'|'supervisor'|'agent'}){
  const [alert,setAlert]=useState<Alert|null>(null);const router=useRouter()
  useEffect(()=>{if(role==='agent')return;const supabase=createClient();const channel=supabase.channel(`emergencies-${userId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'emergency_alerts'},payload=>{const next=payload.new as Alert&{supervisor_id:string|null};if(role==='supervisor'&&next.supervisor_id!==userId)return;setAlert(next);router.refresh()}).subscribe();return()=>{void supabase.removeChannel(channel)}},[role,router,userId])
  if(!alert)return null
  return <div className="fixed left-1/2 top-4 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 border-l-4 border-red-700 bg-red-600 p-4 text-white shadow-2xl"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0"/><div className="min-w-0 flex-1"><p className="font-black">URGENCE — {alert.agent_name}</p><p className="text-xs text-red-100">Agent {alert.agent_code} · {new Date(alert.created_at).toLocaleTimeString('fr-DZ')}</p><p className="mt-1 text-sm font-semibold">{alert.message}</p></div><button onClick={()=>setAlert(null)} className="rounded p-1 hover:bg-white/10"><X size={18}/></button></div></div>
}
