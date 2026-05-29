import { notFound } from 'next/navigation'
import { promises as fs } from 'fs'
import path from 'path'
import Part5Quiz from '@/components/Part5Quiz'
import Part67Quiz from '@/components/Part67Quiz'
import { getPart5FromSheets, getPart67FromSheets } from '@/lib/sheets'

export default async function QuizPage({ params }: PageProps<'/quiz/[part]'>) {
  const { part } = await params

  if (!['5', '6', '7'].includes(part)) notFound()

  const partNum = parseInt(part) as 5 | 6 | 7

  // ── Try Google Sheets first ──────────────────────────────────────────────
  if (process.env.GOOGLE_SHEET_ID) {
    try {
      if (partNum === 5) {
        const questions = await getPart5FromSheets()
        if (questions.length > 0) return <Part5Quiz questions={questions} part={5} />
      } else {
        const passages = await getPart67FromSheets(partNum)
        if (passages.length > 0) return <Part67Quiz passages={passages} part={partNum} />
      }
    } catch (e) {
      console.error('Sheets fetch failed, falling back to data.json:', e)
    }
  }

  // ── Fallback: local data.json ────────────────────────────────────────────
  const dataPath = path.join(process.cwd(), 'public', 'data.json')
  const raw = await fs.readFile(dataPath, 'utf-8')
  const data = JSON.parse(raw)

  if (partNum === 5) return <Part5Quiz questions={data.part5} part={5} />
  const passages = partNum === 6 ? data.part6 : data.part7
  return <Part67Quiz passages={passages} part={partNum} />
}
