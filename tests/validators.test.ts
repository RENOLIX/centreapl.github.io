import { describe, expect, it } from 'vitest'
import { telHref } from '../src/lib/validators'
describe('telHref',()=>{it('creates a phone link without spaces',()=>{expect(telHref('+213 555 12 34 56')).toBe('tel:+213555123456')})})
