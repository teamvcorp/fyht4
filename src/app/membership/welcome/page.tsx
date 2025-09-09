import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export default function WelcomePage() {
  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
            You’re in! 🎉
          </h1>
          <p className="mt-4 text-neutral-600">
            Your member account is ready. Next up: choose a plan or explore community projects.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/membership#plans"
              className="rounded-2xl bg-neutral-900 px-6 py-3 text-white font-semibold hover:bg-neutral-800 transition"
            >
              View Member Plans
            </a>
            <a
              href="/dashboard"
              className="rounded-2xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 hover:border-neutral-500 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
