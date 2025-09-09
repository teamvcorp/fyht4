import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { Container } from '@/components/Container'
import { RootLayout } from '@/components/RootLayout'
import { ConnectGoogleButton, SignOutButton } from './ClientButtons'

export default async function Connections() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/membership')

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <div className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-neutral-900">Connected accounts</h1>
          <p className="mt-2 text-neutral-600">
            Signed in as <span className="font-medium">{session.user?.email}</span>
          </p>

          <div className="mt-6 flex gap-3">
            <ConnectGoogleButton />
            <SignOutButton />
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            If your Google address matches your account email and is verified, it will be linked automatically.
          </p>
        </div>
      </Container>
    </RootLayout>
  )
}
