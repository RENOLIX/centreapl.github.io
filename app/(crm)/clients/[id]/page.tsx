import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function ClientPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const supabase=await createClient()
  const {data:client,error}=await supabase.from('clients').select('*').eq('id',id).single()
  if(error||!client) notFound()
  const details=client.metadata&&Object.keys(client.metadata).length?JSON.stringify(client.metadata,null,2):'Aucune information enregistrée.'
  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-black">{client.first_name} {client.last_name}</h1><p className="mt-1 text-sm text-slate-500">Fiche client</p></div><section className="card grid gap-4 p-6 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-400">Téléphone</p><a className="mt-1 block font-bold text-amber-700" href={`tel:${client.phone}`}>{client.phone||'Non renseigné'}</a></div><div><p className="text-xs font-bold uppercase text-slate-400">Ville</p><p className="mt-1 font-semibold">{client.city||'Non renseignée'}</p></div><div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-slate-400">Informations</p><pre className="mt-1 whitespace-pre-wrap font-sans">{details}</pre></div></section></div>
}
