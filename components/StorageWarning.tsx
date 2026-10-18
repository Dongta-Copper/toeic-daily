'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

const CACHE_KEY = 'storage_health'

// Shows a banner when the server data store is unreachable, so results are not silently lost again.
export default function StorageWarning() {
  const [down, setDown] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    let cached: string | null = null
    try {
      cached = sessionStorage.getItem(CACHE_KEY)
    } catch {}
    if (cached) {
      Promise.resolve().then(() => setDown(cached === 'down'))
      return
    }
    fetch('/api/storage-health', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { ok: boolean }) => {
        try {
          sessionStorage.setItem(CACHE_KEY, d.ok ? 'up' : 'down')
        } catch {}
        setDown(!d.ok)
      })
      .catch(() => {})
  }, [])

  if (!down || pathname === '/login') return null
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Kho dữ liệu trên máy chủ đang lỗi — kết quả chỉ được lưu tạm trên <b>trình duyệt này</b> và sẽ tự đồng bộ lên máy chủ khi được sửa.
          Không xóa dữ liệu trình duyệt / không dùng tab ẩn danh trong lúc này.
        </span>
      </div>
    </div>
  )
}
