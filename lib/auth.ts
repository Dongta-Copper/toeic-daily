'use client'

const AUTH_KEY = 'toeic_auth'

export function login(username: string, password: string): boolean {
  if (username === 'Dongta' && password === '123456789') {
    localStorage.setItem(AUTH_KEY, '1')
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === '1'
}
