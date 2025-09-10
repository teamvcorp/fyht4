// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role?: 'user' | 'admin'
      zipcode?: string | null
      isSubscriber?: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'user' | 'admin'
    zipcode?: string | null
    isSubscriber?: boolean
  }
}

export {}
