import { notFound } from 'next/navigation'
import { promises as fs } from 'fs'
import path from 'path'
import Part5Quiz from '@/components/Part5Quiz'
import Part67Quiz from '@/components/Part67Quiz'

export default async function QuizPage({ params }: PageProps<'/quiz/[part]'>) {
  const { part } = await params

  if (!['5', '6', '7'].includes(part)) notFound()

  const dataPath = path.join(process.cwd(), 'public', 'data.json')
  const raw = await fs.readFile(dataPath, 'utf-8')
  const data = JSON.parse(raw)

  const partNum = parseInt(part)

  if (partNum === 5) {
    return <Part5Quiz questions={data.part5} part={partNum} />
  }

  const passages = partNum === 6 ? data.part6 : data.part7
  return <Part67Quiz passages={passages} part={partNum} />
}
