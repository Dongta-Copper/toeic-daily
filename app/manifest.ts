import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'English Daily — IELTS & Situation',
    short_name: 'English Daily',
    description: 'Luyện IELTS General Reading và tiếng Anh tình huống công việc mỗi ngày',
    start_url: '/situation',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#111827',
    icons: [
      { src: '/app-icon/192', sizes: '192x192', type: 'image/png' },
      { src: '/app-icon/512', sizes: '512x512', type: 'image/png' },
      { src: '/app-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
