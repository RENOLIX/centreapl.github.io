'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

export function LogoutButton() {
  async function logout() { await createClient().auth.signOut(); window.location.assign('/login') }
  return <button onClick={logout} className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900"><LogOut size={18}/>Déconnexion</button>
}
