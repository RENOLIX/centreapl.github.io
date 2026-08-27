import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const input = await request.json() as { name?: string; description?: string }
  if (!input.name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('campaigns').insert({ name: input.name.trim(), description: input.description?.trim() || '' }).select().single()
  return NextResponse.json(error ? { error: error.message } : data, { status: error ? 500 : 201 })
}

export async function PATCH(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const input = await request.json() as { id?: string; active?: boolean }
  if (!input.id || typeof input.active !== 'boolean') return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  const supabase = await createClient()
  const { error } = await supabase.from('campaigns').update({ active: input.active }).eq('id', input.id)
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 200 })
}
