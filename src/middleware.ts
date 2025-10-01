import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Allow access to the admin elevation endpoint for any authenticated user
      if (req.nextUrl.pathname === '/api/admin/elevate') {
        return !!token
      }
      
      // All other admin routes require admin role
      return token?.role === 'admin'
    },
  },
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
