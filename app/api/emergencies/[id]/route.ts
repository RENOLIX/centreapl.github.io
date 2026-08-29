import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;const supabase=await createClient();const {error}=await supabase.from('emergency_alerts').update({acknowledged_at:new Date().toISOString()}).eq('id',id)
  return NextResponse.json(error?{error:error.message}:{ok:true},{status:error?500:200})
}
