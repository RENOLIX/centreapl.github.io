import { createClient } from '@/lib/supabase/server'

export async function isCurrentUserAdmin() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return false
  const profile = await supabase.from('users').select('role').eq('id', data.user.id).maybeSingle()
  return profile.data?.role === 'admin'
}
