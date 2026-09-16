import { HelpManagement } from '@/components/crm/help-management'
import { getCurrentProfile } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function CreateHelpVideoPage(){const profile=await getCurrentProfile();if(!profile)redirect('/login');if(profile.role!=='admin')redirect('/help');return <div className="mx-auto max-w-3xl space-y-5"><div><h1 className="text-2xl font-black">Créer une vidéo</h1><p className="mt-1 text-sm text-slate-500">La diffusion sera choisie ensuite dans « Mes vidéos ».</p></div><HelpManagement/></div>}
