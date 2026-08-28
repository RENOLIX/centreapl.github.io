import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRole } from '@/lib/admin-auth'
import { AgentWorkstation } from '@/components/crm/agent-workstation'
import { CheckCircle2 } from 'lucide-react'

export const dynamic='force-dynamic'
type Assignment={id:string;clients:{id:string;first_name:string;last_name:string;phone:string;email:string;city:string;metadata:Record<string,unknown>}|null;campaigns:{name:string;description:string}|null}
export default async function WorkPage(){if(await getCurrentRole()!=='agent')redirect('/dashboard');const supabase=await createClient();const [{data:assignment},{data:results}]=await Promise.all([supabase.from('client_assignments').select('id,clients(id,first_name,last_name,phone,email,city,metadata),campaigns(name,description)').eq('status','active').order('assigned_at',{ascending:true}).limit(1).maybeSingle(),supabase.from('call_results').select('id,label').eq('active',true).order('label')]);const row=assignment as unknown as Assignment|null;if(!row?.clients)return <div className="card grid min-h-80 place-items-center p-8 text-center"><div><CheckCircle2 size={52} className="mx-auto text-emerald-500"/><h1 className="mt-4 text-2xl font-black">File terminée</h1><p className="mt-2 text-slate-500">Aucun client ne vous est actuellement affecté.</p></div></div>;return <div className="space-y-4"><div><h1 className="text-xl font-black">Poste agent</h1><p className="text-sm text-slate-500">Un seul client à la fois · appel manuel uniquement.</p></div><AgentWorkstation client={{...row.clients,campaign_name:row.campaigns?.name||null,campaign_script:row.campaigns?.description||null}} results={results||[]}/></div>}
