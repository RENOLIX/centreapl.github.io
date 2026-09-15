import { NextResponse } from 'next/server'
import { isCurrentUserAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const allowed=new Set(['video/mp4','video/webm','video/quicktime'])
export async function POST(request:Request){
  if(!await isCurrentUserAdmin())return NextResponse.json({error:'Accès administrateur requis'},{status:403})
  const form=await request.formData();const file=form.get('video');const title=String(form.get('title')||'').trim();const description=String(form.get('description')||'').trim();const recipientIds=form.getAll('recipientId').map(String)
  if(!(file instanceof File)||!title||title.length>160||description.length>2000||!recipientIds.length)return NextResponse.json({error:'Titre, vidéo et au moins un destinataire sont requis.'},{status:400})
  if(!allowed.has(file.type)||file.size>524288000)return NextResponse.json({error:'Vidéo MP4, WebM ou MOV requise (500 Mo maximum).'},{status:400})
  const admin=createAdminClient();const extension=file.name.split('.').pop()?.replace(/[^a-z0-9]/gi,'').toLowerCase()||'mp4';const path=`${crypto.randomUUID()}.${extension}`
  const upload=await admin.storage.from('crm-help-videos').upload(path,file,{contentType:file.type,upsert:false})
  if(upload.error)return NextResponse.json({error:upload.error.message},{status:500})
  const {data:video,error}=await admin.from('help_videos').insert({title,description,storage_path:path,mime_type:file.type}).select('id').single()
  if(error||!video){await admin.storage.from('crm-help-videos').remove([path]);return NextResponse.json({error:error?.message||'Création impossible'},{status:500})}
  const {error:recipientsError}=await admin.from('help_video_recipients').insert([...new Set(recipientIds)].map(user_id=>({video_id:video.id,user_id})))
  if(recipientsError){await admin.from('help_videos').delete().eq('id',video.id);return NextResponse.json({error:recipientsError.message},{status:500})}
  return NextResponse.json({ok:true,id:video.id},{status:201})
}
