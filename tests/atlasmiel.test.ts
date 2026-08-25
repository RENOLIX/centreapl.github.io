import { describe, expect, it } from 'vitest'
import { toAtlasmielOrder } from '../src/lib/atlasmiel'
describe('toAtlasmielOrder',()=>{it('maps a CRM order to AtlasMiel orders schema',()=>{const order=toAtlasmielOrder({clientId:'1',customerName:'Amine Kaci',customerPhone:'0555',address:{city:'Alger'},productId:'m1',quantity:2},{id:'m1',name:'Miel',price:1200});expect(order.total).toBe(2400);expect(order.status).toBe('pending');expect(order.items[0].quantity).toBe(2)})})
