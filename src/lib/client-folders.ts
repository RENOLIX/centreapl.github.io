import type { SupabaseClient } from '@supabase/supabase-js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function resolveClientFolder(supabase: SupabaseClient, folderId: unknown, folderName: unknown) {
  const name = typeof folderName === 'string' ? folderName.trim() : ''
  if (name) {
    if (name.length > 100) return { id: null, error: 'Le nom du dossier ne peut pas dépasser 100 caractères.' }
    const created = await supabase.from('client_folders').insert({ name }).select('id').maybeSingle()
    if (created.data?.id) return { id: created.data.id as string, error: null }
    if (created.error?.code !== '23505') return { id: null, error: created.error?.message || 'Création du dossier impossible.' }
    const existing = await supabase.from('client_folders').select('id').eq('name', name).maybeSingle()
    return existing.data?.id
      ? { id: existing.data.id as string, error: null }
      : { id: null, error: existing.error?.message || 'Dossier introuvable.' }
  }

  if (typeof folderId !== 'string' || !UUID.test(folderId)) {
    return { id: null, error: 'Choisissez un dossier ou créez-en un nouveau.' }
  }
  const existing = await supabase.from('client_folders').select('id').eq('id', folderId).maybeSingle()
  return existing.data?.id
    ? { id: existing.data.id as string, error: null }
    : { id: null, error: existing.error?.message || 'Le dossier choisi est introuvable.' }
}
