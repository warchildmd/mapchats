'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/'

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (tab === 'register') {
      try {
        await api.register({ email, password, username, displayName })
      } catch (e: unknown) {
        // apiFetch throws an Error with the backend message already extracted
        setError(e instanceof Error ? e.message : 'Registration failed')
        setLoading(false)
        return
      }
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary font-display tracking-tight">GeoPost</h1>
          <p className="text-on-surface-variant text-sm font-body mt-1">
            What's happening around you?
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-surface-container rounded-2xl p-1 mb-6">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={cn(
                'flex-1 py-2 rounded-xl text-sm font-medium font-body capitalize transition-all',
                tab === t ? 'bg-surface-high text-on-surface' : 'text-on-surface-variant'
              )}
            >
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* OAuth buttons */}
        {/* <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="flex items-center justify-center gap-3 bg-surface-container hover:bg-surface-high transition-colors rounded-2xl py-3 text-sm font-medium text-on-surface font-body"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button
            onClick={() => signIn('github', { callbackUrl })}
            className="flex items-center justify-center gap-3 bg-surface-container hover:bg-surface-high transition-colors rounded-2xl py-3 text-sm font-medium text-on-surface font-body"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Continue with GitHub
          </button>
        </div> */}

        {/* <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-surface-high" />
          <span className="text-xs text-on-surface-variant font-body">or</span>
          <div className="flex-1 h-px bg-surface-high" />
        </div> */}

        {/* Credentials form */}
        <form onSubmit={handleCredentials} className="flex flex-col gap-3">
          {tab === 'register' && (
            <>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                required
                className="bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant outline-none focus:ring-1 focus:ring-primary font-body"
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (letters, numbers, _)"
                required
                pattern="[a-zA-Z0-9_]{3,30}"
                className="bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant outline-none focus:ring-1 focus:ring-primary font-body"
              />
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant outline-none focus:ring-1 focus:ring-primary font-body"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
            className="bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant outline-none focus:ring-1 focus:ring-primary font-body"
          />

          {error && (
            <p className="text-error text-sm font-body bg-error/10 rounded-2xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-kinetic-gradient rounded-2xl text-sm font-semibold text-surface font-body disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant font-body mt-4">
          By continuing you agree to the{' '}
          <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
