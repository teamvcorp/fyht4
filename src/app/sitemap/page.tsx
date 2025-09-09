// app/sitemap/page.tsx
'use client'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

type Item = { label: string; href: string; notes?: string }
type Section = { title: string; items: Item[] }

const sections: Section[] = [
  {
    title: 'Public',
    items: [
      { label: 'Home', href: '/' },
      { label: 'Donate', href: '/donate', notes: 'One-time & monthly giving' },
      { label: 'Membership', href: '/membership', notes: 'Google OAuth or Email link' },
      { label: 'Thank You', href: '/thank-you', notes: 'Post-checkout landing' },
    ],
  },
  {
    title: 'Projects',
    items: [
      { label: 'Submit a Proposal', href: '/projects/submit', notes: 'Member form → Admin review' },
      { label: 'Project Detail', href: '/projects/[id]', notes: 'Donate to a specific project; watch/unwatch' },
      // Add a list page later if/when you create it:
      // { label: 'Browse Projects', href: '/projects', notes: 'All projects, filters by ZIP/category' },
    ],
  },
  {
    title: 'Member',
    items: [
      { label: 'Dashboard', href: '/dashboard', notes: 'Profile (name/ZIP), Donated, Watching, Local projects' },
      { label: 'Verify Email', href: '/membership/verify', notes: 'NextAuth Email verification page' },
      { label: 'Welcome', href: '/membership/welcome', notes: 'Post-login handoff' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Admin • Proposals', href: '/admin/proposals', notes: 'Approve/Reject with notes (emails via Resend)' },
      { label: 'Admin • Projects', href: '/admin/projects', notes: 'Start Build / Mark Completed; progress bars' },
    ],
  },
  {
    title: 'System & Policy (optional)',
    items: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      // Add other static pages here as you publish them.
    ],
  },
]

function NowStamp() {
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(now)
  return <span className="text-xs text-neutral-500">Generated: {fmt}</span>
}

function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-2xl bg-neutral-900 px-5 py-2 text-white font-semibold hover:bg-neutral-800 transition"
    >
      Print / Save as PDF
    </button>
  )
}

export default function SiteMapPage() {
  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
                Site Map
              </h1>
              <p className="mt-2 text-neutral-600">
                A printable overview of FYHT4’s pages and flows. Use the button to print or save as PDF.
              </p>
              <div className="mt-2"><NowStamp /></div>
            </div>
            <PrintButton />
          </div>

          <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm print:shadow-none print:border-0 print:p-0">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sections.map((sec) => (
                <li key={sec.title} className="rounded-2xl border border-neutral-200 p-5 print:border-0" style={{ breakInside: 'avoid' as any }}>
                  <h2 className="font-display text-xl font-semibold text-neutral-900">{sec.title}</h2>
                  <ul className="mt-3 space-y-2">
                    {sec.items.map((it) => (
                      <li key={it.href} className="text-sm">
                        <a href={it.href} className="font-semibold text-neutral-900 underline decoration-neutral-300 hover:decoration-neutral-600">
                          {it.label}
                        </a>
                        <span className="text-neutral-500"> — {it.href}</span>
                        {it.notes && <div className="text-neutral-600">{it.notes}</div>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <div className="mt-8 text-xs text-neutral-500 print:mt-4">
              Notes:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><code>/projects/[id]</code> is a dynamic route; replace with the actual project ID or slug when sharing.</li>
                <li>Admin pages are restricted via your <code>ADMIN_EMAILS</code> env list.</li>
              </ul>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* Inline print-specific tweaks */}
      <style>{`
        @media print {
          /* Make content use full width and black-on-white for clarity */
          html, body { background: #fff !important; color: #000 !important; }
          a { color: #000 !important; text-decoration: underline; }
          /* Avoid splitting cards across pages */
          .avoid-break { break-inside: avoid; }
        }
      `}</style>
    </RootLayout>
  )
}
