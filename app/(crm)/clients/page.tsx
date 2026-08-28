import { Search } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientManagement } from '@/components/crm/client-management'
import { ClientList } from '@/components/crm/client-list'
import { getCurrentRole } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

type Client = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  city: string
  metadata: Record<string, unknown>
  client_folders: { name: string } | null
}

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const role = await getCurrentRole()
  if (role === 'agent') redirect('/work')
  const { q = '' } = await searchParams
  let data: Client[] = []
  let count = 0
  let folders: { id: string; name: string }[] = []

  try {
    const supabase = await createClient()
    let query = supabase.from('clients').select('id,first_name,last_name,phone,email,city,metadata,client_folders(name)', { count: 'exact' }).order('created_at', { ascending: false })
    const clean = q.trim().replace(/[,%()]/g, '')
    if (clean) query = query.or(`first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,phone.ilike.%${clean}%,city.ilike.%${clean}%`)
    const [result, folderResult] = await Promise.all([query, supabase.from('client_folders').select('id,name').order('name')])
    data = (result.data ?? []) as unknown as Client[]
    count = result.count ?? 0
    folders = folderResult.data ?? []
  } catch {}

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-black">Clients</h1><p className="mt-1 text-sm text-slate-500">{count} contact(s) accessible(s) depuis Supabase.</p></div>
    <ClientManagement folders={folders} />
    <section className="card overflow-hidden">
      <form className="flex border-b border-slate-100 p-4"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-slate-400"/><input name="q" defaultValue={q} placeholder="Rechercher un nom, téléphone ou ville" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-amber-400"/></div><button className="btn btn-primary ml-2">Rechercher</button></form>
      <ClientList clients={data} isAdmin={role === 'admin'} hasSearch={Boolean(q)} />
    </section>
  </div>
}
