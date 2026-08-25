import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientSchema } from '@/lib/validators'
export async function GET(){const supabase=await createClient(); const {data,error}=await supabase.from('clients').select('*').order('created_at',{ascending:false}); return NextResponse.json(data||[],{status:error?500:200})}
export async function POST(request:Request){const parsed=clientSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});const supabase=await createClient();const {data,error}=await supabase.from('clients').insert(parsed.data).select().single();return NextResponse.json(data||{error:error?.message},{status:error?500:201})}
