import { type Metadata } from 'next'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import MembershipActions from '@/components/membership/MembershipActions'
import { UpgradeButton } from '@/components/membership/UpgradeButton'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/mongoose'
import UserModel from '@/models/User'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Membership',
  description:
    'Join FYHT4 as a member to propose projects, vote by ZIP code, and receive transparent updates.',
}

export default async function MembershipPage() {
  const session = await getServerSession(authOptions)
  
  // If user is logged in, check their subscription status
  if (session?.user?.id) {
    await dbConnect()
    const user = await UserModel.findById(session.user.id).lean()
    
    // If user has an active subscription, redirect to dashboard
    if (user?.activeSubscription && 
        ['active', 'trialing'].includes(user.activeSubscription.status)) {
      redirect('/dashboard')
    }
    
    // User is logged in but doesn't have active subscription - show upgrade options
    return (
      <RootLayout>
        <PageIntro eyebrow="Membership" title="Upgrade to unlock full features">
          <p>
            You're already a member! Upgrade to a monthly membership to propose projects, 
            get priority support, and access exclusive features.
          </p>
        </PageIntro>

        <Container className="mt-12 sm:mt-16">
          <FadeIn className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900 text-center">
                Choose Your Plan
              </h2>
              <p className="mt-2 text-neutral-600 text-center">
                Upgrade your account to access premium features and support the community.
              </p>

              {/* Subscription Plans */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan - Current */}
                <div className="rounded-2xl border border-neutral-200 p-6 bg-neutral-50">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-neutral-900">Free Member</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-neutral-900">$0</span>
                      <span className="text-neutral-600">/month</span>
                    </div>
                    <div className="mt-2 text-sm text-neutral-600 bg-neutral-200 px-3 py-1 rounded-full inline-block">
                      Current Plan
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-neutral-600">Vote on community projects</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-neutral-600">Make one-time donations</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-neutral-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-neutral-600">Watch project progress</span>
                    </li>
                  </ul>
                </div>

                {/* Monthly Plan - Upgrade Option */}
                <div className="rounded-2xl border-2 border-emerald-300 p-6 bg-emerald-50 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Recommended
                    </span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-emerald-900">Monthly Member</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-emerald-900">$10</span>
                      <span className="text-emerald-700">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-emerald-700">Cancel anytime</p>
                  </div>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-emerald-700">Everything in Free</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-emerald-700 font-medium">Submit project proposals</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-emerald-700 font-medium">Priority support</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-emerald-700 font-medium">Early access to features</span>
                    </li>
                  </ul>
                  <div className="mt-6">
                    <UpgradeButton />
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-neutral-600">
                  Already have everything you need?{' '}
                  <Link href="/dashboard" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Go to Dashboard
                  </Link>
                </p>
              </div>
            </div>
          </FadeIn>
        </Container>
      </RootLayout>
    )
  }

  // User is not logged in - show signup flow
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
