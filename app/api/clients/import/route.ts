import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseClientRows } from '@/lib/csv'
import { isCurrentUserManagement } from '@/lib/admin-auth'
import { resolveClientFolder } from '@/lib/client-folders'

export async function POST(request: Request) {
  if (!(await isCurrentUserManagement())) return NextResponse.json({ error: 'Accès gestion requis' }, { status: 403 })
  const body = await request.json() as { rows?: Record<string, string>[]; folderId?: string; folderName?: string }
  const parsed = parseClientRows(body.rows || [])
  const supabase = await createClient()
  const folder = await resolveClientFolder(supabase, body.folderId, body.folderName)
  if (!folder.id) return NextResponse.json({ error: folder.error, rejected: parsed.rejected }, { status: 400 })

  if (parsed.accepted.length) {
    const rows = parsed.accepted.map(client => ({
      folder_id: folder.id,
      first_name: client.firstName,
      last_name: client.lastName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      metadata: { telephone_2: client.phone2, adresse: client.address, commune: client.commune, wilaya: client.wilaya, total: client.total, produit: client.product },
    }))
    const { error } = await supabase.from('clients').insert(rows)
    if (error) return NextResponse.json({ error: error.message, rejected: parsed.rejected }, { status: 500 })
  }
  return NextResponse.json(parsed)
}
