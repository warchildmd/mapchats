import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GeoPost — Real-time location-based posts',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-28 md:pt-36 md:pb-40 text-center">
        {/* Map-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#97a9ff 1px, transparent 1px), linear-gradient(90deg, #97a9ff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-[130px]" />
          <div className="absolute bottom-0 left-1/4 w-[350px] h-[300px] bg-tertiary/8 rounded-full blur-[110px]" />
          <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-secondary/6 rounded-full blur-[90px]" />
        </div>

        {/* Pulsing map-activity dots */}
        <PulseDot color="bg-secondary" size="w-3 h-3" className="absolute top-24 left-[12%]" delay="0s" />
        <PulseDot color="bg-primary"   size="w-2.5 h-2.5" className="absolute top-40 right-[18%]" delay="0.7s" />
        <PulseDot color="bg-tertiary"  size="w-2 h-2"   className="absolute bottom-32 left-[22%]" delay="1.4s" />
        <PulseDot color="bg-primary"   size="w-2 h-2"   className="absolute bottom-24 right-[14%]" delay="2s" />

        <div className="relative max-w-3xl mx-auto">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-surface-high border border-outline-variant/40">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[pulse_2s_ease-in-out_infinite]" />
            <span className="text-[11px] font-semibold text-primary/70 uppercase tracking-[0.18em] font-body">Live Now</span>
          </div>

          {/* Logo pin */}
          <div className="flex justify-center mb-7">
            <div className="w-14 h-14 bg-kinetic-gradient rounded-[50%_50%_50%_0] rotate-[-45deg] shadow-[0_0_0_10px_rgba(151,169,255,0.1),0_0_40px_rgba(151,169,255,0.2)]" />
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-5 leading-[1.05]">
            Geo<span className="bg-kinetic-gradient bg-clip-text text-transparent">Post</span>
          </h1>
          <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-xl mx-auto mb-10 leading-relaxed">
            Discover what&apos;s happening around you right now. Posts tied to physical locations, fading over time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://geopostapp.burduja.me"
              className="inline-flex items-center justify-center bg-kinetic-gradient text-surface font-body font-semibold text-sm px-8 py-3.5 rounded-2xl hover:opacity-90 transition-opacity shadow-[0_8px_24px_rgba(151,169,255,0.3)]"
            >
              Open Map
            </a>
            <a
              href="https://geopostapp.burduja.me/login"
              className="inline-flex items-center justify-center bg-surface-high border border-outline-variant/40 text-on-surface font-body font-semibold text-sm px-8 py-3.5 rounded-2xl hover:bg-surface-highest transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            color="primary"
            icon={
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Map-Centric"
            body="A real-time map is your feed. Dynamic pins scale by popularity, cluster by density, and reveal what&apos;s happening at every zoom level."
          />
          <FeatureCard
            color="secondary"
            icon={
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Time-Limited Posts"
            body="Every post starts with a 24-hour lifetime. Upvotes and comments extend it — up to 7 days. What fades wasn't worth keeping."
          />
          <FeatureCard
            color="tertiary"
            icon={
              <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Community-Driven"
            body="Upvote, downvote, and discuss with nested threads. Earn karma, level up your reputation, and shape what your neighborhood sees."
          />
        </div>
      </section>

      {/* ── Happening Now ─────────────────────────────────────── */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary font-body mb-6">
            Happening Now
          </p>

          {/* Primary conversation card */}
          <div className="p-5 rounded-3xl bg-surface-high border border-outline-variant/20 shadow-lg mb-3">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-kinetic-gradient flex-shrink-0 flex items-center justify-center font-display font-bold text-xs text-surface">
                E
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-display leading-none mb-0.5">Elena M.</p>
                <p className="text-[11px] text-primary-fixed-dim font-body">2 min ago · Central Park</p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-tertiary font-body">#Event</span>
              </div>
            </div>

            <p className="text-on-surface text-sm font-body leading-relaxed mb-4">
              The sunset jazz session at the fountain just started! The vibe is incredible tonight. If you&apos;re nearby, don&apos;t miss it!
            </p>

            <div className="flex items-center gap-5 text-on-surface-variant">
              <button className="flex items-center gap-1.5 text-xs font-body hover:text-on-surface transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                12
              </button>
              <button className="flex items-center gap-1.5 text-xs font-body hover:text-on-surface transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                48
              </button>
              <div className="ml-auto flex items-center gap-1 text-[11px]">
                <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-on-surface-variant font-body">5h left</span>
              </div>
            </div>
          </div>

          {/* Ghost card — depth effect */}
          <div className="p-4 rounded-3xl bg-surface-container border border-outline-variant/10 opacity-40 scale-[0.97] blur-[1.5px] pointer-events-none">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-surface-highest" />
              <div className="space-y-1.5">
                <div className="w-20 h-2.5 bg-outline-variant/30 rounded-full" />
                <div className="w-14 h-2 bg-outline-variant/20 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-outline-variant/20 rounded-full" />
              <div className="w-3/4 h-2 bg-outline-variant/20 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4">
            Three ways to post
          </h2>
          <p className="font-body text-on-surface-variant text-center text-sm mb-10 max-w-lg mx-auto">
            Every pin on the map belongs to a category. Each one lights up the map in its own color.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-3xl p-6 bg-secondary/8 border border-secondary/20">
              <div className="w-3 h-3 rounded-full bg-alert-gradient mb-4" />
              <h3 className="font-display font-semibold text-lg text-secondary mb-2">Alert</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                Heads up — road closures, outages, safety warnings, or anything time-sensitive your neighbors should know about right now.
              </p>
            </div>

            <div className="rounded-3xl p-6 bg-primary/8 border border-primary/20">
              <div className="w-3 h-3 rounded-full bg-kinetic-gradient mb-4" />
              <h3 className="font-display font-semibold text-lg text-primary mb-2">Discussion</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                What&apos;s going on? New restaurant, noise complaint, local politics — start a thread tied to the place it&apos;s about.
              </p>
            </div>

            <div className="rounded-3xl p-6 bg-tertiary/8 border border-tertiary/20">
              <div className="w-3 h-3 rounded-full bg-event-gradient mb-4" />
              <h3 className="font-display font-semibold text-lg text-tertiary mb-2">Event</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                Markets, meetups, concerts, pop-ups — pin it so people nearby can find it on the map while it&apos;s happening.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-12">How it works</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Explore', body: 'Open the map and zoom into your area. Pins show posts happening nearby.' },
              { n: '2', title: 'Post', body: 'Tap +, pick a category, and drop a pin within 1 km of where you are.' },
              { n: '3', title: 'Engage', body: 'Vote and comment to keep posts alive. The best content stays on the map longer.' },
            ].map(({ n, title, body }) => (
              <div key={n}>
                <div className="w-12 h-12 rounded-2xl bg-surface-high border border-outline-variant/30 flex items-center justify-center mx-auto mb-4 font-display font-black text-primary text-lg">
                  {n}
                </div>
                <h4 className="font-display font-semibold mb-1">{title}</h4>
                <p className="font-body text-sm text-on-surface-variant">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-2xl mx-auto">
          <div className="relative overflow-hidden rounded-4xl bg-surface-high border border-outline-variant/30 px-8 py-14 text-center shadow-2xl">
            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/15 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-secondary/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tertiary/8 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-black mb-4">
                Ready to start mapping?
              </h2>
              <p className="font-body text-on-surface-variant text-sm mb-8 max-w-sm mx-auto">
                Join your neighbors shaping the future of local social maps.
              </p>
              <a
                href="https://geopostapp.burduja.me"
                className="inline-flex items-center justify-center bg-kinetic-gradient text-surface font-body font-bold text-sm px-10 py-4 rounded-full hover:opacity-90 transition-opacity shadow-[0_8px_30px_rgba(151,169,255,0.35)] active:scale-[0.98]"
              >
                Get GeoPost — it&apos;s free
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-outline-variant/20 px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display font-semibold text-sm">
            Geo<span className="text-primary">Post</span>
          </p>
          <div className="flex items-center gap-6 font-body text-xs text-on-surface-variant">
            <Link href="/terms" className="hover:text-on-surface transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-on-surface transition-colors">Privacy Policy</Link>
          </div>
          <p className="font-body text-xs text-on-surface-variant">
            &copy; {new Date().getFullYear()} GeoPost
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function PulseDot({
  color,
  size,
  className,
  delay,
}: {
  color: string
  size: string
  className?: string
  delay: string
}) {
  return (
    <div className={className}>
      <div className={`relative ${size}`}>
        <span
          className={`absolute inset-0 rounded-full ${color} opacity-70`}
          style={{ animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) ${delay} infinite` }}
        />
        <span className={`relative block ${size} rounded-full ${color}`} />
      </div>
    </div>
  )
}

function FeatureCard({
  color,
  icon,
  title,
  body,
}: {
  color: 'primary' | 'secondary' | 'tertiary'
  icon: React.ReactNode
  title: string
  body: string
}) {
  const bg: Record<string, string> = {
    primary: 'bg-primary/12',
    secondary: 'bg-secondary/12',
    tertiary: 'bg-tertiary/12',
  }
  return (
    <div className="glass-card p-6 border border-outline-variant/25 hover:border-outline-variant/50 transition-colors">
      <div className={`w-10 h-10 rounded-xl ${bg[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="font-body text-sm text-on-surface-variant leading-relaxed">{body}</p>
    </div>
  )
}
