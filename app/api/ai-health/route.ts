import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const maxDuration = 60

// Temporary diagnostics: time a quiz-sized request per model, with and without thinking.
export async function GET() {
  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  const prompt = 'Return JSON {"quiz":[...]} with 5 English grammar multiple-choice questions about past simple vs present perfect, each {"q","options","answer","why"}.'
  const name = process.env.GEMINI_MODEL || 'gemini-flash-latest'
  const runs: Record<string, unknown>[] = []
  const variants: [string, string, Record<string, unknown>][] = [
    ['default', name, {}],
    ['no-thinking', name, { thinkingConfig: { thinkingBudget: 0 } }],
    ['low', name, { thinkingConfig: { thinkingLevel: 'low' } }],
    ['lite', 'gemini-flash-lite-latest', {}],
  ]
  await Promise.all(
    variants.map(async ([label, model, extra]) => {
      const t = Date.now()
      try {
        const m = ai.getGenerativeModel({ model, generationConfig: { responseMimeType: 'application/json', temperature: 0.3, ...extra } as never }, { timeout: 50000 })
        const r = await m.generateContent(prompt)
        runs.push({ label, model, ms: Date.now() - t, chars: r.response.text().length, usage: r.response.usageMetadata })
      } catch (e) {
        runs.push({ label, model, ms: Date.now() - t, error: String(e).slice(0, 200) })
      }
    })
  )
  return NextResponse.json({ model: name, runs })
}
