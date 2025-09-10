// src/types/next-auth.d.ts
import type { DefaultSession, DefaultUser } from 'next-auth'
import type { UserRole, Zipcode } from '@/types/user'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      zipcode: Zipcode | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role?: UserRole
    zipcode?: Zipcode | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: UserRole
    zipcode?: Zipcode | null
  }
}

export {}
