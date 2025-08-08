'use client'
import { useState } from 'react'

export default function DocumentSummarization(){
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState(null)

  async function handleUpload(e){
    e.preventDefault()
    const fd = new FormData()
    if(file) fd.append('document', file)
    if(url) fd.append('url', url)
    const res = await fetch('/api/summarize', {method:'POST', body: fd})
    const body = await res.json()
    setSummary(body.summary)
  }

  return (
    <section className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Document / URL Summarization</h2>
      <form onSubmit={handleUpload} className="space-y-3">
        <input type="file" accept=".pdf,.doc,.docx" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <input className="w-full border p-2 rounded" placeholder="Or paste a URL" value={url} onChange={e=>setUrl(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Summarize</button>
      </form>
      {summary && <p className="mt-3 bg-gray-100 p-2 rounded text-sm">{summary}</p>}
    </section>
  )
}