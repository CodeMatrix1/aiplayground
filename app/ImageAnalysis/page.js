'use client'
import { useState } from 'react'

export default function ImageAnalysis(){
  const [file, setFile] = useState(null)
  const [desc, setDesc] = useState(null)

  async function submit(e){
    e.preventDefault()
    if(!file) return
    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch('/api/image-analyze', {method:'POST', body: fd})
    const body = await res.json()
    setDesc(body.description)
  }

  return (
    <section className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Image Analysis</h2>
      <form onSubmit={submit} className="space-y-3">
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Analyze</button>
      </form>
      {desc && <p className="mt-3 bg-gray-100 p-2 rounded text-sm">{desc}</p>}
    </section>
  )
}