import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongoose'
import User from '@/models/User'
import { SubmitProjectForm } from '@/components/projects/SubmitProjectForm'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export default async function SubmitProjectPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/membership?redirect=/projects/submit')
  }

  // Check if user has active subscription
  await dbConnect()
  const user = await User.findById(session.user.id)
    .select('activeSubscription role')
    .lean()

  const hasActiveSubscription = user?.activeSubscription ? 
    (user.activeSubscription.status === 'active' || user.activeSubscription.status === 'trialing') &&
    user.activeSubscription.interval === 'month' &&
    user.activeSubscription.currentPeriodEnd &&
    new Date(user.activeSubscription.currentPeriodEnd).getTime() > Date.now()
    : false

  const isAdmin = user?.role === 'admin'

  if (!isAdmin && !hasActiveSubscription) {
    redirect('/membership?upgrade=true&redirect=/projects/submit')
  }

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            Submit a project proposal
          </h1>
          <p className="mt-3 text-neutral-600">
            Share your idea. After admin review, approved proposals move to the community voting stage.
          </p>
          
          <SubmitProjectForm />
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
