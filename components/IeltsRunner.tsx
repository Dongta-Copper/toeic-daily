'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import IeltsPlayer from '@/components/IeltsPlayer'
import {
  fullPaper,
  generatedSections,
  ieltsAttempts,
  loadTests,
  sectionPaper,
  typePaper,
  type Paper,
  type QType,
} from '@/lib/ielts'

/** Loads the tests and builds the requested paper: a full test, one section, or a question-type drill. */
export default function IeltsRunner({ test, section, type }: { test?: string; section?: string; type?: string }) {
  const [paper, setPaper] = useState<Paper | null | undefined>(undefined)

  useEffect(() => {
    Promise.all([loadTests(), generatedSections.getAll(), ieltsAttempts.getAll()]).then(([tests, generated, attempts]) => {
      const allSections = [
        ...tests.flatMap((t) => t.sections.map((s) => ({ s, title: t.title }))),
        ...generated.map((g) => ({ s: g.section, title: 'Đề AI' })),
      ]
      let p: Paper | null = null
      if (section) {
        const found = allSections.find((x) => x.s.id === section)
        if (found) p = sectionPaper(found.s, found.title)
      } else if (test) {
        const t = tests.find((x) => x.id === test)
        if (t) p = fullPaper(t)
      } else if (type) {
        const done = new Set(attempts.flatMap((a) => a.results.map((r) => r.qid)))
        const drill = typePaper(type as QType, allSections.map((x) => x.s), done)
        if (drill.parts.length) p = drill
      }
      setPaper(p)
    })
  }, [test, section, type])

  if (paper === undefined) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 w-full">
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      </div>
    )
  }
  if (!paper) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 w-full text-sm text-gray-600">
        Không tìm thấy bài luyện này. <Link href="/ielts" className="underline">Quay lại IELTS Reading</Link>
      </div>
    )
  }
  return <IeltsPlayer key={paper.key} paper={paper} />
}
