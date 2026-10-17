import { ImageResponse } from 'next/og'

// Home-screen icon for iPhone / Android (PNG generated on demand, cached by Vercel).
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params
  const size = [180, 192, 512].includes(Number(raw)) ? Number(raw) : 512

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111827',
          color: '#ffffff',
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: size * 0.36, letterSpacing: -size * 0.01 }}>EN</div>
        <div style={{ fontSize: size * 0.09, color: '#9ca3af', marginTop: size * 0.01 }}>DAILY</div>
      </div>
    ),
    { width: size, height: size, headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }
  )
}
