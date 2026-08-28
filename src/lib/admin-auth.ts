import { createClient } from '@/lib/supabase/server'

export type CrmRole = 'admin' | 'supervisor' | 'agent'

export async function getCurrentRole(): Promise<CrmRole | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const profile = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle()
  return (profile.data?.role as CrmRole | undefined) ?? null
}

export async function isCurrentUserAdmin() {
  return (await getCurrentRole()) === 'admin'
}

export async function isCurrentUserManagement() {
  const role = await getCurrentRole()
  return role === 'admin' || role === 'supervisor'
}
