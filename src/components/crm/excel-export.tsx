'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export function ExcelExport({ rows, filename, period }: { rows:Record<string,string|number>[]; filename:string; period:string }) {
  const [pending, setPending] = useState(false)
  async function download() {
    if (!rows.length || pending) return
    setPending(true)
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'CentreAPL AtlasMiel'; workbook.created = new Date()
      const sheet = workbook.addWorksheet('Rapport appels', { views:[{ state:'frozen', ySplit:4 }] })
      const headers = Object.keys(rows[0])
      const endColumn = String.fromCharCode(64 + Math.min(headers.length, 26))
      sheet.mergeCells(`A1:${endColumn}1`)
      const title = sheet.getCell('A1'); title.value = 'RAPPORT DES APPELS — CENTREAPL ATLASMIEL'; title.font = { bold:true, color:{argb:'FFFFFFFF'}, size:16 }; title.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF25292D'} }; title.alignment = { vertical:'middle', horizontal:'center' }; sheet.getRow(1).height = 30
      sheet.mergeCells(`A2:${endColumn}2`)
      const subtitle = sheet.getCell('A2'); subtitle.value = `${period} · Exporté le ${new Intl.DateTimeFormat('fr-DZ',{dateStyle:'medium',timeStyle:'medium',timeZone:'Africa/Algiers'}).format(new Date())}`; subtitle.font = { italic:true, color:{argb:'FF475569'} }; subtitle.alignment = { horizontal:'center' }
      sheet.addRow([])
      const headerRow = sheet.addRow(headers); headerRow.font = { bold:true, color:{argb:'FFFFFFFF'} }; headerRow.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF17A589'} }; headerRow.alignment = { vertical:'middle', horizontal:'center' }; headerRow.height = 24
      rows.forEach((row, index) => { const excelRow = sheet.addRow(headers.map(header => row[header])); excelRow.alignment = { vertical:'top' }; if (index % 2 === 1) excelRow.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFF1F5F9'} } })
      const widths:Record<string,number> = { Date:14, Heure:12, Agent:22, Client:24, Telephone:17, Campagne:22, Resultat:18, Succes:12, Vente:12, Duree_secondes:17, Resume:38 }
      sheet.columns.forEach((column, index) => { column.width = widths[headers[index]] || 18 })
      sheet.autoFilter = { from:{row:4,column:1}, to:{row:4,column:headers.length} }
      sheet.eachRow({includeEmpty:false}, row => row.eachCell(cell => { cell.border = { top:{style:'thin',color:{argb:'FFDCE3E8'}}, left:{style:'thin',color:{argb:'FFDCE3E8'}}, bottom:{style:'thin',color:{argb:'FFDCE3E8'}}, right:{style:'thin',color:{argb:'FFDCE3E8'}} } }))
      const buffer = await workbook.xlsx.writeBuffer()
      const url = URL.createObjectURL(new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))
      const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url)
    } finally { setPending(false) }
  }
  return <button onClick={() => void download()} disabled={!rows.length || pending} className="btn btn-primary disabled:opacity-40">{pending ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}Exporter Excel</button>
}
