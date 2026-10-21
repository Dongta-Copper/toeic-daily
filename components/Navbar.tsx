'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, History, LogOut, User } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const situationMode = pathname.startsWith('/situation')
  if (pathname === '/login') return null

  async function handleLogout() {
    await fetch('/api/login', { method: 'DELETE' }).catch(() => {})
    window.location.href = '/login'
  }

  return (
    <header className="border-b border-gray-200 bg-white flex-shrink-0">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-gray-900 hover:text-gray-600 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">English Daily</span>
        </Link>

        <div className="flex items-center p-0.5 bg-gray-100 rounded-md text-sm">
          <Link
            href="/ielts"
            className={`px-3 py-1.5 rounded transition-colors ${
              !situationMode ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            IELTS
          </Link>
          <Link
            href="/situation"
            className={`px-3 py-1.5 rounded transition-colors ${
              situationMode ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Situation
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href={situationMode ? '/summary' : '/ielts/report'}
            className="flex items-center gap-1.5 p-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            title="Báo cáo"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Báo cáo</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-700">
            <User className="w-4 h-4" />
            <span className="font-medium">Dongta</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 p-1 text-sm text-gray-400 hover:text-red-600 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>
    </header>
  )
}
