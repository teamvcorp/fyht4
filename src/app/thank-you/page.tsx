import { type Metadata } from 'next'
import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Thank you',
  description: 'Your payment was successful.',
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; session_id?: string; mode?: string }>
}) {
  const { status, session_id, mode } = await searchParams
  const isSuccess = (status ?? '').toLowerCase() === 'success'
  const isSub = (mode ?? '').toLowerCase() === 'subscription'

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            {isSuccess ? 'Thank you for your support!' : 'Thanks—request received'}
          </h1>

          <p className="mt-4 text-neutral-600">
            {isSub
              ? 'Your membership is active. You can now propose projects and vote in your ZIP.'
              : 'Your donation was processed successfully.'}
          </p>

          {session_id && (
            <p className="mt-2 text-xs text-neutral-500">
              Reference ID: <span className="font-mono">{session_id}</span>
            </p>
          )}

          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/dashboard"
              className="rounded-2xl bg-neutral-900 px-6 py-3 text-white font-semibold hover:bg-neutral-800 transition"
            >
              Go to Dashboard
            </a>
            <a
              href="/projects"
              className="rounded-2xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 hover:border-neutral-500 transition"
            >
              Explore Projects
            </a>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
