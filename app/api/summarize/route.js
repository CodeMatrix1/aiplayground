import { NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export async function POST(req) {
  const { text } = await req.json()

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Summarize this content:
${text}` }] }]
    })
  })

  const json = await res.json()
  const summary = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary.'

  return NextResponse.json({ summary })
}