import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'GeoPost — Real-time location-based posts',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-32 md:pb-36 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-tertiary/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Logo pin */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 bg-kinetic-gradient rounded-[50%_50%_50%_0] rotate-[-45deg] shadow-[0_0_0_8px_rgba(151,169,255,0.12)]" />
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4">
            Geo<span className="text-primary">Post</span>
          </h1>
          <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-xl mx-auto mb-10 leading-relaxed">
            Discover what&apos;s happening around you right now. Posts tied to physical locations, fading over time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://geopostapp.burduja.me"
              className="inline-flex items-center justify-center bg-kinetic-gradient text-surface font-body font-semibold text-sm px-8 py-3.5 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Open Map
            </a>
            <a
              href="https://geopostapp.burduja.me/login"
              className="inline-flex items-center justify-center border border-outline-variant text-on-surface font-body font-semibold text-sm px-8 py-3.5 rounded-2xl hover:bg-surface-high transition-colors"
            >
              Sign in
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-6 border border-outline-variant/30">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Map-Centric</h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              A real-time map is your feed. Dynamic pins scale by popularity, cluster by density, and reveal what&apos;s happening at every zoom level.
            </p>
          </div>

          <div className="glass-card p-6 border border-outline-variant/30">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Time-Limited Posts</h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Every post starts with a 24-hour lifetime. Upvotes and comments extend it — up to 7 days. What fades wasn&apos;t worth keeping.
            </p>
          </div>

          <div className="glass-card p-6 border border-outline-variant/30">
            <div className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Community-Driven</h3>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Upvote, downvote, and discuss with nested threads. Earn karma, level up your reputation, and shape what your neighborhood sees.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4">
            Three ways to post
          </h2>
          <p className="font-body text-on-surface-variant text-center text-sm mb-10 max-w-lg mx-auto">
            Every pin on the map belongs to a category. Each one lights up the map in its own color.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-3xl p-6 bg-alert-gradient/10 border border-secondary/20">
              <div className="w-3 h-3 rounded-full bg-alert-gradient mb-4" />
              <h3 className="font-display font-semibold text-lg text-secondary mb-2">Alert</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                Heads up — road closures, outages, safety warnings, or anything time-sensitive your neighbors should know about right now.
              </p>
            </div>

            <div className="rounded-3xl p-6 bg-primary/10 border border-primary/20">
              <div className="w-3 h-3 rounded-full bg-kinetic-gradient mb-4" />
              <h3 className="font-display font-semibold text-lg text-primary mb-2">Discussion</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                What&apos;s going on? New restaurant, noise complaint, local politics — start a thread tied to the place it&apos;s about.
              </p>
            </div>

            <div className="rounded-3xl p-6 bg-tertiary/10 border border-tertiary/20">
              <div className="w-3 h-3 rounded-full bg-event-gradient mb-4" />
              <h3 className="font-display font-semibold text-lg text-tertiary mb-2">Event</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                Markets, meetups, concerts, pop-ups — pin it so people nearby can find it on the map while it&apos;s happening.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-12">How it works</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center mx-auto mb-4 font-display font-bold text-primary text-lg">1</div>
              <h4 className="font-display font-semibold mb-1">Explore</h4>
              <p className="font-body text-sm text-on-surface-variant">Open the map and zoom into your area. Pins show posts happening nearby.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center mx-auto mb-4 font-display font-bold text-primary text-lg">2</div>
              <h4 className="font-display font-semibold mb-1">Post</h4>
              <p className="font-body text-sm text-on-surface-variant">Tap +, pick a category, and drop a pin within 1 km of where you are.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center mx-auto mb-4 font-display font-bold text-primary text-lg">3</div>
              <h4 className="font-display font-semibold mb-1">Engage</h4>
              <p className="font-body text-sm text-on-surface-variant">Vote and comment to keep posts alive. The best content stays on the map longer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 px-6 py-10">
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
