'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Search, Volume2 } from 'lucide-react'

type Term = { term: string; ipa: string; vi: string; cat: string; example: string }

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text.replace(/\s*\(.*?\)|…/g, ''))
  u.lang = 'en-GB'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function Glossary() {
  const [terms, setTerms] = useState<Term[] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Tất cả')

  useEffect(() => {
    fetch('/glossary.json')
      .then((r) => r.json())
      .then(setTerms)
  }, [])

  const cats = useMemo(() => ['Tất cả', ...new Set((terms ?? []).map((t) => t.cat))], [terms])
  const list = useMemo(() => {
    const s = q.toLowerCase().trim()
    return (terms ?? []).filter((t) => (cat === 'Tất cả' || t.cat === cat) && (!s || `${t.term} ${t.vi}`.toLowerCase().includes(s)))
  }, [terms, q, cat])

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
      <Link href="/situation" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Practice Situation
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900">Bảng thuật ngữ</h1>
      <p className="text-sm text-gray-500 mt-1 mb-5">FIDIC 2017, PMBOK 8, công trường, email & biên bản họp, IELTS — kèm phiên âm IPA và nút nghe.</p>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm thuật ngữ hoặc nghĩa tiếng Việt…"
          className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-2.5 py-1 rounded-full border text-xs ${cat === c ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {!terms ? (
        <div className="h-24 bg-gray-50 rounded-lg animate-pulse" />
      ) : (
        <ul className="divide-y divide-gray-100 border-y border-gray-100">
          {list.map((t) => (
            <li key={t.term} className="py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900">
                    {t.term} <span className="ml-1 text-sm font-normal text-gray-500">{t.ipa}</span>
                  </p>
                  <p className="text-sm text-gray-700">{t.vi}</p>
                  <p className="text-xs text-gray-500 mt-1 italic">{t.example}</p>
                </div>
                <button onClick={() => speak(t.term)} className="p-1.5 text-gray-400 hover:text-gray-900" title="Nghe thuật ngữ">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
          {list.length === 0 && <li className="py-6 text-center text-sm text-gray-500">Không có thuật ngữ phù hợp.</li>}
        </ul>
      )}
      <p className="mt-4 text-xs text-gray-400">{terms?.length ?? 0} thuật ngữ. Phiên âm theo giọng Anh–Anh.</p>
    </div>
  )
}
