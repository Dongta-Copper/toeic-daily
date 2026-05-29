import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'TOEIC Practice',
  description: 'Practice TOEIC Parts 5, 6, and 7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <AuthGuard>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthGuard>
      </body>
    </html>
  )
}
