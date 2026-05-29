'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { getSessionsLocal, type Session } from '@/lib/history'

const KEY = 'toeic_history'

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
    <div className="max-w-xl mx-auto px-6 py-12 w-full">
      <div className="mb-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors mb-6">
          <ArrowLeft className="w-3 h-3" />
          Home
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">History</h1>
            <p className="text-sm text-gray-500">Your past practice sessions.</p>
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

      {sessions.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">No sessions yet.</p>
          <p className="text-xs text-gray-400 mt-1">Complete a quiz to see your results here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const pct = Math.round((session.score / session.total) * 100)
            return (
              <div key={session.id} className="p-5 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Part {session.part}
                  </span>
                  <span className="text-lg font-semibold text-gray-900 tabular-nums">
                    {session.score}
                    <span className="text-sm font-normal text-gray-400">/{session.total}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-1">
                    <div
                      className="bg-gray-900 h-1 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{pct}%</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(session.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
