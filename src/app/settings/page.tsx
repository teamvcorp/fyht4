import { type Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import Link from 'next/link'
import { SubscriptionCard } from '@/components/settings/SubscriptionCard'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { WalletSettings } from '@/components/settings/WalletSettings'
import { AdminElevation } from '@/components/settings/AdminElevation'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings, subscription, and preferences.',
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/membership')
  }

  await dbConnect()
  const userDoc = await User.findById(session.user.id).lean()
  if (!userDoc) {
    redirect('/membership')
  }

  // Serialize the user data for client components
  const user = {
    _id: userDoc._id.toString(),
    name: userDoc.name || null,
    email: userDoc.email || null,
    zipcode: userDoc.zipcode || null,
    role: userDoc.role,
    createdAt: userDoc.createdAt ? userDoc.createdAt.toISOString() : new Date().toISOString(),
    activeSubscription: userDoc.activeSubscription ? {
      ...userDoc.activeSubscription,
      currentPeriodEnd: userDoc.activeSubscription.currentPeriodEnd?.toISOString() || null,
    } : null,
    stripeCustomerId: userDoc.stripeCustomerId || null,
  }



  // Check if user has active subscription
  const hasActiveSubscription = Boolean(user.activeSubscription && 
    ['active', 'trialing'].includes(user.activeSubscription.status))

  const subscriptionStatus = user.activeSubscription?.status || 'none'
  const nextBilling = user.activeSubscription?.currentPeriodEnd ? new Date(user.activeSubscription.currentPeriodEnd) : null
  const amount = user.activeSubscription?.amount || 0
  const currency = user.activeSubscription?.currency || 'usd'
  const interval = user.activeSubscription?.interval || 'month'

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
                Settings
              </h1>
              <p className="mt-2 text-xl text-neutral-600">
                Manage your account, subscription, and preferences
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Profile Settings */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                    Profile Information
                  </h2>
                  <ProfileSettings user={user} />
                </div>

                {/* Subscription Management */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                    Membership & Billing
                  </h2>
                  <SubscriptionCard
                    hasActiveSubscription={hasActiveSubscription}
                    subscriptionStatus={subscriptionStatus}
                    nextBilling={nextBilling}
                    amount={amount}
                    currency={currency}
                    interval={interval}
                    customerId={user.stripeCustomerId}
                  />
                </div>

                {/* Connected Accounts */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-4">
                    Connected Accounts
                  </h2>
                  <p className="text-neutral-600 mb-4">
                    Manage your linked accounts and authentication methods.
                  </p>
                  <Link
                    href="/settings/connections"
                    className="inline-flex items-center rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 transition"
                  >
                    Manage Connections
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Admin Role Management */}
                <AdminElevation currentRole={user.role || 'user'} />

                {/* Wallet Settings */}
                <WalletSettings />

                {/* Member Status */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">
                    Member Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Account Type</span>
                      <span className={`text-sm font-medium ${hasActiveSubscription ? 'text-emerald-600' : 'text-neutral-900'}`}>
                        {hasActiveSubscription ? 'Monthly Member' : 'Free Member'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Member Since</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {new Date(user.createdAt!).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {hasActiveSubscription && (
                      <div className="pt-3 border-t border-neutral-200">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                          <span className="text-sm text-emerald-600 font-medium">
                            Active Subscription
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/dashboard"
                      className="block text-sm text-neutral-600 hover:text-neutral-900 transition"
                    >
                      → View Dashboard
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                      >
                        🛡️ Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/projects"
                      className="block text-sm text-neutral-600 hover:text-neutral-900 transition"
                    >
                      → Browse Projects
                    </Link>
                    {hasActiveSubscription && (
                      <Link
                        href="/projects/submit"
                        className="block text-sm text-neutral-600 hover:text-neutral-900 transition"
                      >
                        → Submit Project
                      </Link>
                    )}
                    <Link
                      href="/contact"
                      className="block text-sm text-neutral-600 hover:text-neutral-900 transition"
                    >
                      → Contact Support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}