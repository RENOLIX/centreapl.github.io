import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseClientRows } from '@/lib/csv'
export async function POST(request:Request){const body=await request.json() as {rows:Record<string,string>[]};const parsed=parseClientRows(body.rows||[]);if(parsed.accepted.length){const supabase=await createClient();const {error}=await supabase.from('clients').insert(parsed.accepted);if(error)return NextResponse.json({error:error.message,rejected:parsed.rejected},{status:500})}return NextResponse.json(parsed)}
