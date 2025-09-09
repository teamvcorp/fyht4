import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export default function VerifyPage() {
  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-neutral-900">
            Check your email ✉️
          </h1>
          <p className="mt-4 text-neutral-600">
            We’ve sent you a secure sign-in link. Open it on this device to complete setup.
          </p>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
