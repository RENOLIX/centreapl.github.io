import { Sidebar } from '@/components/crm/sidebar'
import { MobileNav } from '@/components/crm/mobile-nav'
import { Bell, Menu, ShieldCheck } from 'lucide-react'
import { getCurrentProfile } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { PresenceHeartbeat } from '@/components/crm/presence-heartbeat'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AM'
}

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  const role = profile.role || 'agent'
  const accountName = profile.fullName
  const supabase = await createClient()
  const [callbackResult,workResult,pauseResult]=await Promise.all([
    supabase.from('callbacks').select('*',{count:'exact',head:true}).eq('status','scheduled'),
    role==='agent'?supabase.from('client_assignments').select('*',{count:'exact',head:true}).eq('status','active'):Promise.resolve({count:0}),
    role!=='agent'?supabase.from('pause_sessions').select('*',{count:'exact',head:true}).is('ended_at',null):Promise.resolve({count:0}),
  ])
  const badges={callbacks:callbackResult.count??0,work:workResult.count??0,pauses:pauseResult.count??0,notifications:(callbackResult.count??0)+(workResult.count??0)+(pauseResult.count??0)}

  return (
    <div className="flex min-h-screen bg-[#edf1f4]">
      <PresenceHeartbeat isAgent={role === 'agent'} />
      <Sidebar role={role} badges={badges} />
      <div className="min-w-0 flex-1 pb-20 lg:pb-0">
        <header className="flex h-12 items-center justify-between bg-[#242424] px-4 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <Menu size={17} className="text-slate-300" />
            <span className="text-xs font-semibold text-slate-300">Centre d’appel AtlasMiel</span>
          </div>
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/notifications" className="relative hidden shrink-0 text-slate-300 sm:block"><Bell size={16}/>{badges.notifications>0&&<span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1 text-[8px] font-black text-white">{badges.notifications>9?'9+':badges.notifications}</span>}</Link>
            <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-semibold text-emerald-400 sm:flex">
              <ShieldCheck size={14} />
              {role === 'admin' ? 'Administrateur' : role === 'supervisor' ? 'Superviseur' : 'Agent'}
            </span>
            <div className="flex min-w-0 items-center gap-2 border-l border-white/10 pl-3 sm:pl-4">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#17a589] text-[10px] font-black">
                {initials(accountName)}
              </div>
              <div className="min-w-0 text-right">
                <p className="max-w-40 truncate text-xs font-semibold sm:max-w-56">{accountName}</p>
                {profile.email && (
                  <p className="hidden max-w-56 truncate text-[9px] text-slate-400 md:block">{profile.email}</p>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="p-3 sm:p-4 lg:p-5">{children}</main>
      </div>
      <MobileNav role={role} badges={badges} />
    </div>
  )
}
