'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, History, LogOut, User } from 'lucide-react'
import { isLoggedIn, logout } from '@/lib/auth'

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  function handleLogout() {
    logout()
    window.location.reload()
  }

  return (
    <header className="border-b border-gray-200 bg-white flex-shrink-0">
      <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          TOEIC Practice
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </Link>

          {loggedIn && (
            <>
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span className="font-medium">Dongta</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
