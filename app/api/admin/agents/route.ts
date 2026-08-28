import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  if (!await isCurrentUserAdmin()) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('users').select('id,full_name,email,role,created_at,agents(id,code,active)').order('created_at', { ascending: false })
  return NextResponse.json(error ? { error: error.message } : { users: data }, {
    status: error ? 500 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: Request) {
  if (!await isCurrentUserAdmin()) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const input = await request.json() as { email?: string; password?: string; fullName?: string; role?: 'admin' | 'supervisor' | 'agent'; code?: string }
  const email = input.email?.trim().toLowerCase()
  const fullName = input.fullName?.trim()
  const role = input.role === 'admin' ? 'admin' : input.role === 'supervisor' ? 'supervisor' : 'agent'
  const code = input.code?.trim().toUpperCase()
  if (!email || !fullName || !input.password || input.password.length < 8 || (role === 'agent' && !code)) {
    return NextResponse.json({ error: 'Nom, email, mot de passe (8 caractères minimum) et code agent sont requis.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const created = await admin.auth.admin.createUser({ email, password: input.password, email_confirm: true, user_metadata: { full_name: fullName, role } })
  if (created.error || !created.data.user) return NextResponse.json({ error: created.error?.message || 'Création impossible' }, { status: 400 })

  const userId = created.data.user.id
  const profile = await admin.from('users').insert({ id: userId, email, full_name: fullName, role })
  if (profile.error) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profile.error.message }, { status: 500 })
  }
  if (role === 'agent') {
    const agent = await admin.from('agents').insert({ user_id: userId, code, active: true })
    if (agent.error) {
      await admin.from('users').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: agent.error.message }, { status: 500 })
    }
  }
  const { data: user, error: readError } = await admin
    .from('users')
    .select('id,full_name,email,role,created_at,agents(id,code,active)')
    .eq('id', userId)
    .single()

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  return NextResponse.json({ user }, {
    status: 201,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function PATCH(request: Request) {
  if (!await isCurrentUserAdmin()) return NextResponse.json({ error: 'Accès administrateur requis' }, { status: 403 })
  const input = await request.json() as { userId?: string; active?: boolean }
  if (!input.userId || typeof input.active !== 'boolean') return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  const admin = createAdminClient()
  const { error } = await admin.from('agents').update({ active: input.active }).eq('user_id', input.userId)
  return NextResponse.json(error ? { error: error.message } : { ok: true }, { status: error ? 500 : 200 })
}

export async function DELETE(request:Request){
  if(!await isCurrentUserAdmin())return NextResponse.json({error:'Accès administrateur requis'},{status:403})
  const input=await request.json() as {userId?:string}
  if(!input.userId)return NextResponse.json({error:'Utilisateur requis'},{status:400})
  const session=await createClient()
  const {data:auth}=await session.auth.getUser()
  if(auth.user?.id===input.userId)return NextResponse.json({error:'Vous ne pouvez pas supprimer votre propre compte'},{status:400})
  const admin=createAdminClient()
  await admin.from('agents').update({active:false}).eq('user_id',input.userId)
  const {error}=await admin.auth.admin.deleteUser(input.userId)
  return NextResponse.json(error?{error:error.message}:{ok:true},{status:error?500:200})
}
