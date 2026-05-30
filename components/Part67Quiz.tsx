'use client'

import { useState, useEffect } from 'react'
import { saveSession } from '@/lib/history'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

type SubQuestion = {
  id: string
  question: string
  options: { A: string; B: string; C: string; D: string }
  answer: string
  explanation: string
}

type Passage = {
  id: string
  passage: string
  questions: SubQuestion[]
}

function randomPassage(all: Passage[], excludeId?: string): Passage {
  if (all.length === 1) return all[0]
  const pool = all.filter((p) => p.id !== excludeId)
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function Part67Quiz({ passages: allPassages, part }: { passages: Passage[]; part: number }) {
  const [current, setCurrent] = useState<Passage | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { setCurrent(randomPassage(allPassages)) }, [])

  if (!current) return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  )

  const answered = Object.keys(selected).length
  const score = current.questions.filter((q) => selected[q.id] === q.answer).length

  async function handleSubmit() {
    if (!current) return
    const finalScore = current.questions.filter((q) => selected[q.id] === q.answer).length
    const results = current.questions.map((q) => ({
      questionId: q.id,
      question: q.question,
      options: q.options,
      userAnswer: selected[q.id] ?? '',
      correctAnswer: q.answer,
      isCorrect: selected[q.id] === q.answer,
      explanation: q.explanation,
    }))
    setSubmitted(true)
    await saveSession(part, finalScore, current.questions.length, results)
  }

  function handleNewPack() {
    setCurrent(randomPassage(allPassages, current?.id))
    setSelected({})
    setSubmitted(false)
  }

  return (
    <div className="flex flex-col flex-1" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            Part {part}
          </span>
          {submitted && (
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              {score}/{current.questions.length}
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({Math.round((score / current.questions.length) * 100)}%)
              </span>
            </span>
          )}
        </div>

        {submitted && (
          <button
            onClick={handleNewPack}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            New Pack
          </button>
        )}
      </div>

      {/* Split screen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane — passage */}
        <div className="w-1/2 overflow-y-auto border-r border-gray-200 p-8 bg-gray-50">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-5">Passage</p>
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-mono bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            {current.passage}
          </div>
        </div>

        {/* Right pane — questions */}
        <div className="w-1/2 overflow-y-auto p-8">
          <div className="space-y-8">
            {current.questions.map((q, qi) => {
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

                  <p className="text-gray-900 mb-3 leading-relaxed text-sm">
                    <span className="text-gray-400 mr-2 select-none">{qi + 1}.</span>
                    {q.question}
                  </p>

                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const isSelected = userAnswer === opt
                      const isAnswer = q.answer === opt

                      let cls =
                        'flex items-start gap-3 px-3 py-2.5 rounded-md border text-sm cursor-pointer transition-all duration-100 '

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
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border-l-2 border-gray-300">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Explanation</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {!submitted ? (
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-4">
              <button
                onClick={handleSubmit}
                className="px-7 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
              >
                Submit All Answers
              </button>
              <span className="text-xs text-gray-400 tabular-nums">
                {answered}/{current.questions.length} answered
              </span>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t border-gray-200">
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
      </div>
    </div>
  )
}
