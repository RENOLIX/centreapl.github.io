import Link from 'next/link'
import { PlusCircle, Video } from 'lucide-react'
import { getCurrentProfile } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export default async function HelpPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-black">Aide</h1><p className="mt-1 text-sm text-slate-500">Ressources et consignes du centre d’appel.</p></div><div className="grid gap-4 sm:grid-cols-2"><Link href="/help/videos" className="card flex min-h-44 flex-col justify-center p-6 transition hover:border-emerald-400 hover:shadow-md"><Video className="text-emerald-600" size={30}/><h2 className="mt-5 font-black">Mes vidéos</h2><p className="mt-1 text-sm text-slate-500">Voir les vidéos publiées et vos consignes.</p></Link>{profile.role==='admin'&&<Link href="/help/create" className="card flex min-h-44 flex-col justify-center p-6 transition hover:border-amber-400 hover:shadow-md"><PlusCircle className="text-amber-600" size={30}/><h2 className="mt-5 font-black">Créer une vidéo</h2><p className="mt-1 text-sm text-slate-500">Téléverser une nouvelle vidéo de formation.</p></Link>}</div></div>
}
