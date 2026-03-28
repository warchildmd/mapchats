import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p className="text-6xl font-bold text-surface-highest font-display">404</p>
      <h1 className="text-xl font-bold text-on-surface font-display">Page not found</h1>
      <p className="text-on-surface-variant text-sm font-body">
        This post may have expired or moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-kinetic-gradient rounded-full text-surface font-semibold text-sm font-body"
      >
        Back to Map
      </Link>
    </div>
  )
}
