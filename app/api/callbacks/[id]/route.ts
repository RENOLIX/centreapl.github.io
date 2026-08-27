import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params
  const input=await request.json() as {status?:'completed'|'cancelled'}
  if(!['completed','cancelled'].includes(input.status||''))return NextResponse.json({error:'Statut invalide'},{status:400})
  const supabase=await createClient()
  const {error}=await supabase.from('callbacks').update({status:input.status}).eq('id',id)
  return NextResponse.json(error?{error:error.message}:{ok:true},{status:error?500:200})
}
