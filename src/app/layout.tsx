import { type Metadata } from 'next'
import {Providers} from './providers'
import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: {
    template: '%s | FYHT4 Change',
    default: 'FYHT4 Change',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-neutral-950 text-base antialiased">
      <body className="flex min-h-full flex-col"><Providers>{children}</Providers></body>
    </html>
  )
}
