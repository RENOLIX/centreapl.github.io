'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PresenceHeartbeat({ isAgent }: { isAgent: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!isAgent) return
    let active = true
    async function ping(refresh = false) {
      if (document.visibilityState === 'hidden') return
      const response = await fetch('/api/presence', { method: 'POST', cache: 'no-store' }).catch(() => null)
      if (active && refresh && response?.ok) router.refresh()
    }
    void ping(true)
    const timer = window.setInterval(() => void ping(), 30_000)
    const onVisibility = () => { if (document.visibilityState === 'visible') void ping(true) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility) }
  }, [isAgent, router])

  return null
}
