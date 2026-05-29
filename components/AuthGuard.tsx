'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Eye, EyeOff, LogIn } from 'lucide-react'
import { isLoggedIn, login } from '@/lib/auth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAuthed(isLoggedIn())
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (login(username, password)) {
      setAuthed(true)
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.')
    }
  }

  if (authed === null) return null

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10">
            <BookOpen className="w-5 h-5 text-gray-900" />
            <span className="font-semibold tracking-tight text-gray-900 text-lg">TOEIC Practice</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mb-7">Nhập thông tin tài khoản để tiếp tục</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-md px-4 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors mt-2"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
