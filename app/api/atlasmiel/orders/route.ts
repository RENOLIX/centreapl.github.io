import { NextResponse } from 'next/server'
import { atlasmielAdmin, toAtlasmielOrder } from '@/lib/atlasmiel'
export async function POST(request:Request){const input=await request.json();const product={id:String(input.productId),name:String(input.productName),price:Number(input.price)};const order=toAtlasmielOrder(input,product);const {data,error}=await atlasmielAdmin().from('orders').insert(order).select().single();return NextResponse.json(data||{error:error?.message},{status:error?500:201})}
