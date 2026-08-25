import { describe, expect, it } from 'vitest'
import { parseClientRows } from '../src/lib/csv'
describe('parseClientRows',()=>{it('accepts french aliases and rejects duplicate phones',()=>{const result=parseClientRows([{Prénom:'Amine','Nom de famille':'Kaci','Téléphone':'0555 12 34 56','Ville':'Alger'},{Prénom:'Autre','Téléphone':'0555 12 34 56'}]);expect(result.accepted[0].firstName).toBe('Amine');expect(result.rejected[0].reason).toContain('doublon')})})
