import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const body = await request.json() as { clientIds?: string[]; allFolder?:boolean; folderId?:string|null }
  const deleteFolder = body.allFolder === true
  if (deleteFolder && body.folderId !== null && (!body.folderId || !UUID.test(body.folderId))) return NextResponse.json({ error: 'Dossier invalide' }, { status: 400 })
  const clientIds = [...new Set(body.clientIds || [])]
  if (!deleteFolder && (!clientIds.length || clientIds.length > 500 || clientIds.some(id => !UUID.test(id)))) {
    return NextResponse.json({ error: 'Sélection de clients invalide' }, { status: 400 })
  }
  const supabase = await createClient()
  const query = supabase.from('clients').delete({ count:'exact' })
  const { data, count, error } = deleteFolder
    ? await (body.folderId === null ? query.is('folder_id', null) : query.eq('folder_id', body.folderId)).select('id')
    : await query.in('id', clientIds).select('id')
  return NextResponse.json(error ? { error: error.message } : { deleted: count ?? data?.length ?? 0 }, { status: error ? 500 : 200 })
}
