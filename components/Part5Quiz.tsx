'use client'

import { useState, useEffect } from 'react'
import { saveSessionLocal } from '@/lib/history'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

type Question = {
  id: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: string
  explanation: string
}

const PACK_SIZE = 5

function randomPack(all: Question[]): Question[] {
  return [...all].sort(() => Math.random() - 0.5).slice(0, Math.min(PACK_SIZE, all.length))
}

export default function Part5Quiz({ questions: allQuestions, part }: { questions: Question[]; part: number }) {
  const [pack, setPack] = useState<Question[] | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { setPack(randomPack(allQuestions)) }, [])

  if (!pack) return (
    <div className="max-w-2xl mx-auto px-6 py-12 w-full">
      <div className="h-8 w-32 bg-gray-100 rounded animate-pulse mb-10" />
      <div className="space-y-6">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-lg animate-pulse" />)}
      </div>
    </div>
  )

  const score = pack.filter((q) => selected[q.id] === q.answer).length
  const answered = Object.keys(selected).length

  function handleSubmit() {
    if (!pack || answered === 0) return
    const finalScore = pack.filter((q) => selected[q.id] === q.answer).length
    const results = pack.map((q) => ({
      questionId: q.id,
      question: q.question,
      options: q.options,
      userAnswer: selected[q.id] ?? '',
      correctAnswer: q.answer,
      isCorrect: selected[q.id] === q.answer,
      explanation: q.explanation,
    }))
    saveSessionLocal(part, finalScore, pack.length, results)
    setSubmitted(true)
  }

  function handleNewPack() {
    setPack(randomPack(allQuestions))
    setSelected({})
    setSubmitted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 w-full">
      <div className="mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Part 5</p>
        <h1 className="text-2xl font-semibold text-gray-900">Incomplete Sentences</h1>
      </div>

      {submitted && (
        <div className="mb-10 p-6 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-4xl font-semibold text-gray-900 tabular-nums mb-1">
                {score}<span className="text-xl font-normal text-gray-400">/{pack.length}</span>
              </div>
              <div className="text-sm text-gray-500">{Math.round((score / pack.length) * 100)}% correct</div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-gray-900 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-900">
                {Math.round((score / pack.length) * 100)}%
              </span>
            </div>
          </div>
          <button
            onClick={handleNewPack}
            className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Pack
          </button>
        </div>
      )}

      <div className="space-y-10">
        {pack.map((q, i) => {
          const userAnswer = selected[q.id]
          const isCorrect = submitted && userAnswer === q.answer
          const isWrong = submitted && userAnswer && userAnswer !== q.answer

          return (
            <div key={q.id} className="relative">
              {submitted && (
                <div className={`absolute -left-6 top-0 ${isCorrect ? 'text-green-500' : isWrong ? 'text-red-400' : 'text-gray-300'}`}>
                  {isCorrect ? <CheckCircle className="w-4 h-4" /> : isWrong ? <XCircle className="w-4 h-4" /> : null}
                </div>
              )}

              <p className="text-gray-900 mb-4 leading-relaxed">
                <span className="text-gray-400 mr-2 select-none">{i + 1}.</span>
                {q.question}
              </p>

              <div className="space-y-2">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const isSelected = userAnswer === opt
                  const isAnswer = q.answer === opt

                  let cls =
                    'flex items-start gap-3 px-4 py-3 rounded-md border text-sm cursor-pointer transition-all duration-100 '

                  if (!submitted) {
                    cls += isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  } else {
                    if (isAnswer) {
                      cls += 'border-green-500 bg-green-50'
                    } else if (isSelected) {
                      cls += 'border-red-400 bg-red-50'
                    } else {
                      cls += 'border-gray-100 opacity-60'
                    }
                  }

                  return (
                    <label key={opt} className={cls}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        disabled={submitted}
                        checked={isSelected}
                        onChange={() => setSelected((prev) => ({ ...prev, [q.id]: opt }))}
                        className="mt-0.5 accent-gray-900 flex-shrink-0"
                      />
                      <span>
                        <span className="font-medium text-gray-400 mr-2">{opt}.</span>
                        <span
                          className={
                            submitted && isAnswer
                              ? 'text-green-700 font-medium'
                              : submitted && isSelected && !isAnswer
                              ? 'text-red-600'
                              : 'text-gray-700'
                          }
                        >
                          {q.options[opt]}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>

              {submitted && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md border-l-2 border-gray-300">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Explanation</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!submitted && (
        <div className="mt-14 flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={answered === 0}
            className="px-7 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit Answers
          </button>
          <span className="text-xs text-gray-400 tabular-nums">
            {answered}/{pack.length} answered
          </span>
        </div>
      )}

      {submitted && (
        <div className="mt-10 pt-8 border-t border-gray-200 flex justify-center">
          <button
            onClick={handleNewPack}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Pack
          </button>
        </div>
      )}
    </div>
  )
}
