'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, TrendingUp, Trash2, XCircle } from 'lucide-react'
import { getSessionsLocal, type Session } from '@/lib/history'

const KEY = 'toeic_history'

function PartCard({ part, sessions }: { part: number; sessions: Session[] }) {
  const partSessions = sessions.filter((s) => s.part === part)

  if (partSessions.length === 0) {
    return (
      <div className="p-5 border border-dashed border-gray-200 rounded-lg">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">Part {part}</p>
        <p className="text-sm text-gray-300">—</p>
      </div>
    )
  }

  const totalScore = partSessions.reduce((s, x) => s + x.score, 0)
  const totalQ = partSessions.reduce((s, x) => s + x.total, 0)
  const avgPct = Math.round((totalScore / totalQ) * 100)

  return (
    <div className="p-5 border border-gray-200 rounded-lg">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Part {part}</p>
      <div className="text-3xl font-bold text-gray-900 tabular-nums leading-none mb-1">{avgPct}%</div>
      <div className="text-xs text-gray-400 mb-4">
        {totalScore}/{totalQ} đúng · {partSessions.length} lần làm
      </div>
      <div className="bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-gray-900 h-1.5 rounded-full transition-all"
          style={{ width: `${avgPct}%` }}
        />
      </div>
    </div>
  )
}

function SessionCard({ session }: { session: Session }) {
  const [open, setOpen] = useState(false)
  const pct = Math.round((session.score / session.total) * 100)
  const hasResults = Array.isArray(session.results) && session.results.length > 0

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Row header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest w-12 flex-shrink-0">
          Part {session.part}
        </span>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 bg-gray-100 rounded-full h-1">
            <div
              className="bg-gray-900 h-1 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{pct}%</span>
        </div>

        <span className="text-sm font-semibold text-gray-900 tabular-nums">
          {session.score}
          <span className="text-xs font-normal text-gray-400">/{session.total}</span>
        </span>

        <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">
          {new Date(session.createdAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })}
        </span>

        {hasResults ? (
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}
      </div>

      {/* Expandable question list */}
      {open && hasResults && (
        <div className="border-t border-gray-100 divide-y divide-gray-100 bg-gray-50">
          {session.results.map((r, i) => (
            <div key={r.questionId} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {r.isCorrect
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <XCircle className="w-4 h-4 text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                  <span className="text-gray-400 mr-1 select-none">{i + 1}.</span>
                  {r.question}
                </p>
                {!r.isCorrect && (
                  <div className="flex items-center gap-3 mt-1.5">
                    {r.userAnswer
                      ? <span className="text-xs text-red-500">Bạn chọn: <strong>{r.userAnswer}</strong></span>
                      : <span className="text-xs text-gray-400">Bỏ trống</span>
                    }
                    <span className="text-xs text-green-600">Đáp án đúng: <strong>{r.correctAnswer}</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    setSessions(getSessionsLocal())
  }, [])

  function clearHistory() {
    localStorage.removeItem(KEY)
    setSessions([])
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 w-full">
      {/* Page header */}
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" />
          Home
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-500">Thống kê luyện tập của bạn</p>
          </div>
          {sessions.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors pb-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Overview cards */}
      <div className="mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Tổng quan
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[5, 6, 7].map((part) => (
            <PartCard key={part} part={part} sessions={sessions} />
          ))}
        </div>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">Chưa có session nào.</p>
          <p className="text-xs text-gray-400 mt-1">Hoàn thành một bài quiz để xem kết quả ở đây.</p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
            Chi tiết · {sessions.length} session{sessions.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
