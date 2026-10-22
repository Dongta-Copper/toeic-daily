'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { BookOpen, History, LogOut, User } from 'lucide-react'

function readUser() {
  const m = document.cookie.match(/(?:^|; )ed_user=([^;]*)/)
  return m ? decodeURIComponent(decodeURIComponent(m[1])) : ''
}

export default function Navbar() {
  const pathname = usePathname()
  const user = useSyncExternalStore(
    () => () => {},
    readUser,
    () => ''
  )
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
          {[
            { href: '/roadmap', label: 'Lộ trình', active: pathname.startsWith('/roadmap') || pathname === '/summary' },
            { href: '/ielts', label: 'IELTS', active: pathname.startsWith('/ielts') },
            { href: '/situation', label: 'Situation', active: situationMode },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`px-2.5 sm:px-3 py-1.5 rounded transition-colors ${
                t.active ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
            </Link>
          ))}
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
            <span className="font-medium">{user || 'Tài khoản'}</span>
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
