import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import StorageWarning from '@/components/StorageWarning'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'English Daily',
  description: 'IELTS General Reading và tiếng Anh tình huống công việc',
  // Lets iPhone "Add to Home Screen" open the site full-screen like an app.
  appleWebApp: { capable: true, title: 'English Daily', statusBarStyle: 'default' },
  icons: { apple: '/app-icon/180' },
}

export const viewport: Viewport = {
  themeColor: '#111827',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <AuthGuard>
          <Navbar />
          <StorageWarning />
          <main className="flex-1 flex flex-col pb-[env(safe-area-inset-bottom)]">{children}</main>
        </AuthGuard>
      </body>
    </html>
  )
}
