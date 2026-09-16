import Link from 'next/link'
import { CircleHelp, Video } from 'lucide-react'
import { getCurrentProfile } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic='force-dynamic'
export default async function HelpPage(){const profile=await getCurrentProfile();if(!profile)redirect('/login');return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-black">Aide</h1><p className="mt-1 text-sm text-slate-500">Ressources et consignes du centre d’appel.</p></div><Link href="/help/videos" className="card flex items-center gap-5 p-6 transition hover:border-emerald-400 hover:shadow-md"><div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Video size={28}/></div><div className="flex-1"><h2 className="font-black">Vidéos</h2><p className="mt-1 text-sm text-slate-500">{profile.role==='admin'?'Publier et organiser les vidéos pour vos équipes.':'Voir les vidéos qui vous ont été attribuées.'}</p></div><CircleHelp className="text-slate-300"/></Link></div>}
