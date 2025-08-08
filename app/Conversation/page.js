'use client'
import { useState } from 'react'

export default function ConversationAnalysis(){
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)

  async function handleUpload(e){
    e.preventDefault()
    if(!file) return
    setStatus('Uploading...')
    const fd = new FormData()
    fd.append('audio', file)
    const res = await fetch('/api/upload-audio', { method:'POST', body: fd })
    const body = await res.json()
    setResult(body)
    setStatus('Done')
  }

  return (
    <section className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Conversation Analysis</h2>
      <form onSubmit={handleUpload} className="space-y-3">
        <input type="file" accept="audio/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Upload & Analyze</button>
          <span className="self-center text-sm text-gray-500">{status}</span>
        </div>
      </form>
      {result && (
        <div className="mt-4">
          <h3 className="font-medium">Transcription</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">{result.transcription}</pre>
          <h3 className="font-medium mt-3">Diarization</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">{JSON.stringify(result.diarization, null, 2)}</pre>
        </div>
      )}
    </section>
  )
}