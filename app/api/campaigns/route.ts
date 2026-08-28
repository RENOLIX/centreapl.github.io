import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isCurrentUserManagement } from '@/lib/admin-auth'

export async function POST(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const input = await request.json() as { name?: string; description?: string }
  if (!input.name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  const supabase = await createClient()
  const { data, error } = await supabase.from('campaigns').insert({ name: input.name.trim(), description: input.description?.trim() || '' }).select().single()
  return NextResponse.json(error ? { error: error.message } : data, { status: error ? 500 : 201 })
}

export async function PATCH(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const input = await request.json() as { id?: string; name?: string; description?: string; active?: boolean }
  if (!input.id) return NextResponse.json({ error: 'Campagne requise' }, { status: 400 })
  const changes: { name?: string; description?: string; active?: boolean } = {}
  if (typeof input.name === 'string') {
    if (!input.name.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    changes.name = input.name.trim()
  }
  if (typeof input.description === 'string') changes.description = input.description.trim()
  if (typeof input.active === 'boolean') changes.active = input.active
  if (!Object.keys(changes).length) return NextResponse.json({ error: 'Aucune modification' }, { status: 400 })
  const supabase = await createClient()
  const { error } = await supabase.from('campaigns').update(changes).eq('id', input.id)
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 200 })
}

export async function DELETE(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const input = await request.json() as { id?: string }
  if (!input.id) return NextResponse.json({ error: 'Campagne requise' }, { status: 400 })
  const supabase = await createClient()
  const { error } = await supabase.from('campaigns').delete().eq('id', input.id)
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 200 })
}
