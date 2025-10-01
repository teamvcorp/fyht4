import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'
import { Resend } from 'resend'
import User from '@/models/User'
import dbConnect from '@/lib/mongoose'

if (!process.env.GOOGLE_CLIENT_ID) throw new Error('Missing GOOGLE_CLIENT_ID')
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error('Missing GOOGLE_CLIENT_SECRET')
if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
if (!process.env.RESEND_FROM_EMAIL) throw new Error('Missing RESEND_FROM_EMAIL')

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

/** Minimal shape we read from User in callbacks */
type ActiveSub = {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  interval: 'day' | 'week' | 'month' | 'year' | null
  currentPeriodEnd: Date | null
}
type UserMeta = {
  role?: 'user' | 'admin'
  zipcode?: string | null
  activeSubscription?: ActiveSub | null
}

function computeIsSubscriber(user: UserMeta | null | undefined) {
  const sub = user?.activeSubscription
  if (!sub) return false
  if (sub.interval !== 'month') return false
  const ok = new Set<ActiveSub['status']>(['trialing', 'active', 'past_due'])
  if (!ok.has(sub.status)) return false
  if (!sub.currentPeriodEnd) return false
  return new Date(sub.currentPeriodEnd).getTime() > Date.now()
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/membership',
    verifyRequest: '/membership/verify',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      maxAge: 24 * 60 * 60,
      sendVerificationRequest: async ({ identifier, url }) => {
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
    async jwt({ token, user, trigger }) {
      // Always keep an explicit id (besides token.sub)
      if (user) {
        (token as any).id = (user as any).id ?? (user as any)?._id?.toString() ?? token.sub
      } else if (!(token as any).id && token?.sub) {
        (token as any).id = token.sub
      }

      // Refresh user data on sign-in, or if role/subscription is undefined, or periodically
      const shouldRefresh = user || 
                           (token as any).role === undefined || 
                           (token as any).isSubscriber === undefined ||
                           trigger === 'update'

      if (shouldRefresh) {
        try {
          await dbConnect()
          const userId = (token as any).id ?? token.sub
          const doc = await User.findById(userId)
            .select('activeSubscription role zipcode')
            .lean<UserMeta | null>()
          
          const newRole = doc?.role ?? 'user'
          const newZipcode = doc?.zipcode ?? null
          const newIsSubscriber = computeIsSubscriber(doc)
          
          // Always update these values from database
          ;(token as any).role = newRole
          ;(token as any).zipcode = newZipcode
          ;(token as any).isSubscriber = newIsSubscriber
          
          console.log('JWT token refreshed:', {
            userId,
            role: newRole,
            isSubscriber: newIsSubscriber,
            subscription: doc?.activeSubscription
          })
        } catch (error) {
          console.error('JWT refresh error:', error)
          ;(token as any).role = (token as any).role ?? 'user'
          ;(token as any).zipcode = (token as any).zipcode ?? null
          ;(token as any).isSubscriber = false
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = (token as any)?.id ?? token.sub
        ;(session.user as any).role = (token as any)?.role ?? 'user'
        ;(session.user as any).zipcode = (token as any)?.zipcode ?? null
        ;(session.user as any).isSubscriber = Boolean((token as any)?.isSubscriber)
      }
      return session
    },
  },

  events: {
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
