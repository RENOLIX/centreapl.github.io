import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validators'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const parsed = clientSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Informations client invalides' }, { status: 400 })
  const { id } = await params
  const input = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update({
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    email: input.email || '',
    city: input.city || input.commune || '',
    metadata: {
      information: input.notes || '',
      telephone_2: input.phone2 || '',
      adresse: input.address || '',
      commune: input.commune || '',
      wilaya: input.wilaya || '',
      total: input.total || '',
      produit: input.product || '',
    },
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 200 })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 200 })
}
