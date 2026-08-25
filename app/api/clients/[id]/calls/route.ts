import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callOutcomeSchema } from '@/lib/validators'
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const parsed=callOutcomeSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:parsed.error.flatten()},{status:400});const supabase=await createClient();const {data:agent}=await supabase.from('agents').select('id').single();if(!agent)return NextResponse.json({error:'Agent introuvable'},{status:403});const {data,error}=await supabase.from('calls').insert({client_id:id,agent_id:agent.id,...parsed.data}).select().single();return NextResponse.json(data||{error:error?.message},{status:error?500:201})}
