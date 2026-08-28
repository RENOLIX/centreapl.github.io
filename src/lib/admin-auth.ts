import { createClient } from '@/lib/supabase/server'

export type CrmRole = 'admin' | 'supervisor' | 'agent'

export type CurrentProfile = {
  role: CrmRole | null
  fullName: string
  email: string
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role,full_name,email')
    .eq('id', data.user.id)
    .maybeSingle()

  const email = profile?.email || data.user.email || ''
  const metadataName = data.user.user_metadata?.full_name

  return {
    role: (profile?.role as CrmRole | undefined) ?? null,
    fullName:
      profile?.full_name?.trim() ||
      (typeof metadataName === 'string' ? metadataName.trim() : '') ||
      email ||
      'Compte CRM',
    email,
  }
}

export async function getCurrentRole(): Promise<CrmRole | null> {
  return (await getCurrentProfile())?.role ?? null
}

export async function isCurrentUserAdmin() {
  return (await getCurrentRole()) === 'admin'
}

export async function isCurrentUserManagement() {
  const role = await getCurrentRole()
  return role === 'admin' || role === 'supervisor'
}
