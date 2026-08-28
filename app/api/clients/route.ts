import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validators'
import { isCurrentUserManagement } from '@/lib/admin-auth'
import { resolveClientFolder } from '@/lib/client-folders'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data || [], { status: error ? 500 : 200 })
}

export async function POST(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const body = await request.json()
  const parsed = clientSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Informations client invalides' }, { status: 400 })

  const supabase = await createClient()
  const folder = await resolveClientFolder(supabase, body.folderId, body.folderName)
  if (!folder.id) return NextResponse.json({ error: folder.error }, { status: 400 })

  const input = parsed.data
  const { data, error } = await supabase.from('clients').insert({
    folder_id: folder.id,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    email: input.email || '',
    city: input.city || input.commune || '',
    metadata: { information: input.notes || '', telephone_2: input.phone2 || '', adresse: input.address || '', commune: input.commune || '', wilaya: input.wilaya || '', total: input.total || '', produit: input.product || '' },
  }).select().single()
  return NextResponse.json(data || { error: error?.message }, { status: error ? 500 : 201 })
}
