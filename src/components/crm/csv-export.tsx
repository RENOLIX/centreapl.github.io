'use client'

import { Download } from 'lucide-react'

export function CsvExport({ rows, filename }: { rows: Record<string, string | number>[]; filename: string }) {
  function download() {
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const escape = (value: string | number) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = '\ufeff' + [headers.map(escape).join(';'), ...rows.map(row => headers.map(key => escape(row[key])).join(';'))].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href=url; link.download=filename; link.click(); URL.revokeObjectURL(url)
  }
  return <button onClick={download} disabled={!rows.length} className="btn btn-primary disabled:opacity-40"><Download size={16}/>Exporter CSV</button>
}
