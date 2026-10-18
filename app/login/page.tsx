import LoginForm from '@/components/LoginForm'

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next } = await searchParams
  // Only allow same-site paths as the destination after login.
  const dest = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/'
  return <LoginForm next={dest} />
}
