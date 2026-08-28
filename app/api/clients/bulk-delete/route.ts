import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const body = await request.json() as { clientIds?: string[] }
  const clientIds = [...new Set(body.clientIds || [])]
  if (!clientIds.length || clientIds.length > 500 || clientIds.some(id => !UUID.test(id))) {
    return NextResponse.json({ error: 'Sélection de clients invalide' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase.from('clients').delete().in('id', clientIds).select('id')
  return NextResponse.json(error ? { error: error.message } : { deleted: data?.length || 0 }, { status: error ? 500 : 200 })
}
