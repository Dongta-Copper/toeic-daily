import Link from 'next/link'
import { History, BookOpen } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white flex-shrink-0">
      <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-gray-900 hover:text-gray-600 transition-colors">
          <BookOpen className="w-4 h-4" />
          TOEIC Practice
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <History className="w-4 h-4" />
          History
        </Link>
      </nav>
    </header>
  )
}
