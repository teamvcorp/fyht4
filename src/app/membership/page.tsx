import { type Metadata } from 'next'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import MembershipActions from '@/components/membership/MembershipActions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Membership',
  description:
    'Join FYHT4 as a member to propose projects, vote by ZIP code, and receive transparent updates.',
}

export default async function MembershipPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/dashboard')
  }
  return (
    <RootLayout>
      <PageIntro eyebrow="Membership" title="Join the movement. Shape what gets built.">
        <p>
          Become a member to propose projects, vote locally, and receive transparent progress updates.
          Choose Google sign-in or a one-time email link. You can also opt into our newsletter.
        </p>
      </PageIntro>

      <Container className="mt-12 sm:mt-16">
        <FadeIn className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900 text-center">
              Create your member account
            </h2>
            <p className="mt-2 text-neutral-600 text-center">
              Sign up in seconds. We’ll confirm your email with a secure link (via Resend).
            </p>

            {/* Client actions (Google OAuth, email signup, newsletter toggle) */}
            <MembershipActions />
          </div>

          {/* Benefits band, same tone as Donate page */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-900">Propose & Vote</p>
              <p className="mt-1 text-neutral-700">Members surface needs and vote by ZIP code.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-900">Transparent Delivery</p>
              <p className="mt-1 text-neutral-700">See progress updates and outcomes for funded builds.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="font-semibold text-neutral-900">Community First</p>
              <p className="mt-1 text-neutral-700">Your membership funds local, equitable action.</p>
            </div>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
