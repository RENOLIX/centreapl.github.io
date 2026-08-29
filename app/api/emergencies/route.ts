import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request:Request){
  const supabase=await createClient();const input=await request.json().catch(()=>({})) as {message?:string}
  const message=input.message?.trim()||null
  if(message&&message.length>300)return NextResponse.json({error:'Message trop long'},{status:400})
  const {data,error}=await supabase.rpc('create_emergency_alert',{p_message:message})
  return NextResponse.json(error?{error:error.message}:{sent:(data??[]).length},{status:error?500:201})
}
