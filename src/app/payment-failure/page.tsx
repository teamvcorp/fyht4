import { type Metadata } from 'next'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Payment failed',
  description: 'We could not complete your payment.',
}

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const msg =
    (reason ?? '').toLowerCase() === 'cancelled'
      ? 'You cancelled the checkout before completing payment.'
      : 'Something went wrong while processing your payment.'

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            Payment failed
          </h1>
          <p className="mt-4 text-neutral-600">{msg}</p>

          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/projects"
              className="rounded-2xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 hover:border-neutral-500 transition"
            >
              Back to Projects
            </a>
            <a
              href="/donate"
              className="rounded-2xl bg-neutral-900 px-6 py-3 text-white font-semibold hover:bg-neutral-800 transition"
            >
              Try again
            </a>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
