import { z } from 'zod'

export const callOutcomeSchema = z.object({ resultId: z.string().uuid(), durationSeconds: z.coerce.number().int().min(0).max(86400).default(0), summary: z.string().max(2000).optional() })
export const clientSchema = z.object({ firstName:z.string().min(1), lastName:z.string().min(1), phone:z.string().min(3), email:z.string().email().optional().or(z.literal('')), city:z.string().optional(), notes:z.string().optional(),phone2:z.string().optional(),address:z.string().optional(),commune:z.string().optional(),wilaya:z.string().optional(),total:z.string().optional(),product:z.string().optional() })
export function telHref(phone:string){ const normalized=phone.replace(/[^\d+]/g,''); return `tel:${normalized}` }
