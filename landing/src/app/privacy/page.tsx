import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="border-b border-outline-variant/30 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display font-semibold text-sm hover:text-primary transition-colors">
            &larr; GeoPost
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-16">
        <article className="max-w-3xl mx-auto prose prose-invert prose-sm prose-headings:font-display prose-headings:tracking-tight prose-p:font-body prose-p:text-on-surface-variant prose-li:font-body prose-li:text-on-surface-variant prose-a:text-primary prose-strong:text-on-surface">
          <h1>Privacy Policy</h1>
          <p className="text-on-surface-variant text-xs !mt-0">Effective: March 28, 2026</p>

          <h2>1. Information We Collect</h2>

          <h3>Account Information</h3>
          <p>When you register, we collect:</p>
          <ul>
            <li><strong>Email address</strong> and <strong>username</strong> (required for all accounts).</li>
            <li><strong>Display name</strong> and <strong>avatar</strong> (optional, editable in your profile).</li>
            <li><strong>Password hash</strong> — we never store your password in plain text.</li>
          </ul>

          <h3>OAuth Data</h3>
          <p>
            If you sign in with Google or GitHub, we receive your name, email, and profile picture from the provider. We store a provider identifier to link your account — we do not store your OAuth access tokens long-term.
          </p>

          <h3>Location Data</h3>
          <p>
            When you create a post, we collect the GPS coordinates from your device. These coordinates are stored with the post and are visible on the public map. We also use your approximate location to enforce the 1 km proximity restriction for posting.
          </p>
          <p>
            Location data is only collected when you actively create a post or grant location permission. We do not track your location in the background.
          </p>

          <h3>Content</h3>
          <p>
            Posts, comments, votes, and uploaded images are stored for the duration of the post&apos;s lifetime (up to 7 days). Once a post expires, all associated content is permanently deleted.
          </p>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li><strong>Providing the service:</strong> Displaying posts on the map, rendering profiles, computing karma scores.</li>
            <li><strong>Authentication:</strong> Verifying your identity via JWT tokens and OAuth sessions.</li>
            <li><strong>Location enforcement:</strong> Validating proximity when you create a post.</li>
            <li><strong>Moderation:</strong> Enabling moderators and administrators to review and remove content that violates our terms.</li>
          </ul>

          <h2>3. Cookies &amp; Tokens</h2>
          <p>
            GeoPost uses JWT (JSON Web Tokens) for authentication rather than traditional cookies.
          </p>
          <ul>
            <li><strong>Access tokens</strong> are short-lived (15 minutes) and stored in memory.</li>
            <li><strong>Refresh tokens</strong> are stored server-side in Redis and rotate on each use. They expire after 30 days of inactivity.</li>
            <li><strong>Session cookies</strong> are used by NextAuth.js to maintain your logged-in state in the browser.</li>
          </ul>

          <h2>4. Data Storage &amp; Security</h2>
          <ul>
            <li>User data and posts are stored in a PostgreSQL database with PostGIS for geographic queries.</li>
            <li>Refresh tokens are stored in Redis with automatic expiration.</li>
            <li>Uploaded images are stored on the server filesystem and served over HTTPS.</li>
            <li>Passwords are hashed with bcrypt before storage.</li>
          </ul>

          <h2>5. Data Retention</h2>
          <ul>
            <li><strong>Posts:</strong> Automatically deleted after expiry (24 hours to 7 days depending on engagement). A background worker checks for expired posts every 5 minutes.</li>
            <li><strong>Account data:</strong> Retained as long as your account is active.</li>
            <li><strong>Refresh tokens:</strong> Automatically expire after 30 days.</li>
          </ul>

          <h2>6. Third-Party Services</h2>
          <p>We integrate with the following third-party services:</p>
          <ul>
            <li><strong>Google OAuth</strong> — for sign-in. Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.</li>
            <li><strong>GitHub OAuth</strong> — for sign-in. Subject to <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub&apos;s Privacy Statement</a>.</li>
            <li><strong>OpenFreeMap</strong> — for map tiles. No user data is shared with this service.</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>You may:</p>
          <ul>
            <li>Update your display name and avatar from your profile settings.</li>
            <li>Delete your own posts at any time.</li>
            <li>Request account deletion by contacting us.</li>
          </ul>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            GeoPost is not intended for users under the age of 13. We do not knowingly collect personal information from children.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes take effect when posted. Continued use of GeoPost constitutes acceptance.
          </p>

          <h2>10. Contact</h2>
          <p>
            Privacy questions? Reach out at <strong>privacy@geopost.app</strong>.
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/30 px-6 py-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display font-semibold text-sm">
            Geo<span className="text-primary">Post</span>
          </p>
          <div className="flex items-center gap-6 font-body text-xs text-on-surface-variant">
            <Link href="/terms" className="hover:text-on-surface transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-on-surface">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
