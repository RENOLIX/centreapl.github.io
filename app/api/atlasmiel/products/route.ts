import { NextResponse } from 'next/server'
import { atlasmielAdmin } from '@/lib/atlasmiel'
export async function GET(){const {data,error}=await atlasmielAdmin().from('products').select('id,name,price,active').eq('active',true).order('name');return NextResponse.json(data||{error:error?.message},{status:error?500:200})}
