import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY!)

function magicLinkEmailHtml(url: string, host: string) {
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
    <h2>Sign in to FYHT4</h2>
    <p>Click the secure link below to finish signing in:</p>
    <p><a href="${url}" style="background:#10b981;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;display:inline-block">Sign in</a></p>
    <p style="color:#6b7280;font-size:12px">Link will expire shortly. If you didn’t request this, you can ignore this email.</p>
    <p style="color:#6b7280;font-size:12px">FYHT4 • ${host}</p>
  </div>`
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/membership', // optional: send users to your membership page
    verifyRequest: '/membership/verify', // optional landing after email sent
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      maxAge: 24 * 60 * 60, // 24h
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { host } = new URL(url)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!, // e.g. "FYHT4 <login@fyht4.com>"
          to: identifier,
          subject: 'Sign in to FYHT4',
          html: magicLinkEmailHtml(url, host),
        })
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) (session.user as any).id = token.sub
      return session
    },
  },
  events: {
    // Send a welcome email to brand-new users (first sign-in)
    createUser: async ({ user }) => {
      if (!user.email) return
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: 'Welcome to FYHT4 👋',
          html: `
            <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
              <h2>Welcome to FYHT4!</h2>
              <p>You're all set. Propose projects, vote by ZIP, and track impact from your dashboard.</p>
            </div>`,
        })
      } catch (e) {
        console.error('Resend welcome email failed:', e)
      }
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
