import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const input=await request.json() as {status?:'pending'|'confirmed'|'cancelled'}
  if(!['pending','confirmed','cancelled'].includes(input.status||''))return NextResponse.json({error:'Statut invalide'},{status:400})
  const supabase=await createClient();const {data,error}=await supabase.from('sales').update({status:input.status,updated_at:new Date().toISOString()}).eq('id',id).select('id').maybeSingle()
  if(error)return NextResponse.json({error:error.message},{status:500});if(!data)return NextResponse.json({error:'Vente introuvable ou non autorisée'},{status:404})
  return NextResponse.json({ok:true})
}
