'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export function DashboardLiveRefresh() {
  const router = useRouter()
  useEffect(() => {
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') router.refresh() }, 15_000)
    const supabase=createClient();const channel=supabase.channel('dashboard-live').on('postgres_changes',{event:'*',schema:'public',table:'pause_sessions'},()=>router.refresh()).on('postgres_changes',{event:'*',schema:'public',table:'emergency_alerts'},()=>router.refresh()).subscribe()
    return () => {window.clearInterval(timer);void supabase.removeChannel(channel)}
  }, [router])
  return null
}
