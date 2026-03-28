import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className="text-on-surface-variant text-xs !mt-0">Effective: March 28, 2026</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating an account or using GeoPost, you agree to these Terms of Service. If you do not agree, do not use the platform.
          </p>

          <h2>2. Account Registration</h2>
          <p>
            You may register using an email and password or through a third-party OAuth provider (Google, GitHub). You are responsible for keeping your credentials secure and for all activity under your account.
          </p>
          <ul>
            <li>You must provide a valid email address and a unique username.</li>
            <li>Accounts are personal and may not be shared or transferred.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>

          <h2>3. Location Data &amp; Posting</h2>
          <p>
            GeoPost is a location-based platform. Creating a post requires granting the app access to your device&apos;s GPS location.
          </p>
          <ul>
            <li>You may only create posts within approximately 1 km of your current physical location.</li>
            <li>Posts are tied to specific geographic coordinates and are visible to all users on the map.</li>
            <li>You may not spoof or falsify your location.</li>
          </ul>

          <h2>4. Post Lifetime &amp; Expiry</h2>
          <p>
            All posts have a limited lifetime. Posts begin with a 24-hour base lifetime which may be extended through community engagement:
          </p>
          <ul>
            <li>Each upvote extends a post&apos;s life by 1 hour.</li>
            <li>Each comment extends a post&apos;s life by 30 minutes.</li>
            <li>The maximum lifetime for any post is 7 days, after which it is permanently removed.</li>
          </ul>
          <p>
            Expired posts and their associated comments and votes are deleted automatically and cannot be recovered.
          </p>

          <h2>5. User Content</h2>
          <p>
            You retain ownership of text and images you post. By posting content, you grant GeoPost a non-exclusive, worldwide license to display, distribute, and store your content for the duration of the post&apos;s lifetime.
          </p>
          <ul>
            <li>Posts may include text and optional image uploads.</li>
            <li>You are solely responsible for the content you publish.</li>
            <li>Content must not violate applicable law or infringe on third-party rights.</li>
          </ul>

          <h2>6. Voting &amp; Karma</h2>
          <p>
            Users may upvote or downvote posts and comments. Net votes contribute to a user&apos;s karma score, displayed on their profile. Karma reflects community trust and has no monetary value. Vote manipulation (e.g., using multiple accounts) is prohibited.
          </p>

          <h2>7. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Post spam, misleading information, or harmful content.</li>
            <li>Harass, threaten, or abuse other users.</li>
            <li>Circumvent location restrictions or manipulate GPS data.</li>
            <li>Create multiple accounts to manipulate votes or evade bans.</li>
            <li>Attempt to access or modify other users&apos; accounts or data.</li>
            <li>Use automated tools to scrape content or interact with the platform.</li>
          </ul>

          <h2>8. Moderation</h2>
          <p>
            GeoPost employs a role-based moderation system. Moderators and administrators may remove posts, delete comments, and restrict users who violate these terms. Moderation decisions are made at our discretion.
          </p>

          <h2>9. Disclaimers</h2>
          <p>
            GeoPost is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee the accuracy of location data, user-generated content, or the availability of the service. We are not responsible for actions taken based on information found on the platform.
          </p>

          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these terms at any time. Continued use of GeoPost after changes constitutes acceptance of the revised terms.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about these terms? Reach out at <strong>support@geopost.app</strong>.
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
            <Link href="/terms" className="text-on-surface">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-on-surface transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
