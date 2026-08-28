import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('touch_agent_presence')
  return NextResponse.json(error ? { error: error.message } : { lastSeenAt: data }, { status: error ? 500 : 200 })
}

export async function DELETE() {
  const supabase = await createClient()
  const { error } = await supabase.rpc('clear_agent_presence')
  return NextResponse.json(error ? { error: error.message } : { cleared: true }, { status: error ? 500 : 200 })
}
