import Papa from 'papaparse'
import { promises as fs } from 'fs'
import path from 'path'
import type { Scenario, SituationDay } from '@/lib/situation'

// CSV columns: day | date | scenario | sentence_number | scenario_type | english_sentence |
//              vietnamese_context | topic | difficulty_level | notes

export async function getSituationDays(): Promise<SituationDay[]> {
  const csvPath = path.join(process.cwd(), 'public', 'situation.csv')
  const text = (await fs.readFile(csvPath, 'utf-8')).replace(/^﻿/, '')
  const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })

  const map = new Map<number, SituationDay>()
  for (const r of data) {
    const day = parseInt(r.day)
    if (!day || !r.english_sentence) continue
    if (!map.has(day)) map.set(day, { day, date: r.date.trim(), sentences: [] })
    const scenario = r.scenario.trim() as Scenario
    const number = parseInt(r.sentence_number)
    map.get(day)!.sentences.push({
      id: `${day}${scenario}${number}`,
      scenario,
      number,
      english: r.english_sentence.trim(),
      vietnamese: r.vietnamese_context.trim(),
      topic: r.topic?.trim() ?? '',
      level: r.difficulty_level?.trim() ?? '',
      notes: r.notes?.trim() ?? '',
    })
  }

  return Array.from(map.values()).sort((a, b) => a.day - b.day)
}
