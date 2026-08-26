import { describe, expect, it } from 'vitest'
import { getAtlasmielConfig, toAtlasmielOrder } from '../src/lib/atlasmiel'
describe('toAtlasmielOrder',()=>{it('maps a CRM order to AtlasMiel orders schema',()=>{const order=toAtlasmielOrder({clientId:'1',customerName:'Amine Kaci',customerPhone:'0555',address:{city:'Alger'},productId:'m1',quantity:2},{id:'m1',name:'Miel',price:1200});expect(order.total).toBe(2400);expect(order.status).toBe('pending');expect(order.items[0].quantity).toBe(2)})})

describe('getAtlasmielConfig',()=>{
  it('uses the AtlasMiel public key so order creation follows its RLS policy',()=>{
    expect(getAtlasmielConfig({
      ATLASMIEL_SUPABASE_URL:'https://atlas.example.supabase.co',
      ATLASMIEL_SUPABASE_ANON_KEY:'public-atlas-key',
      NEXT_PUBLIC_SUPABASE_URL:'https://crm.example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-crm-key',
    })).toEqual({url:'https://atlas.example.supabase.co',key:'public-atlas-key'})
  })
})
