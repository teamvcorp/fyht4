import Link from 'next/link'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Logo } from '@/components/Logo'
import { socialMediaProfiles } from '@/components/SocialMedia'

const navigation = [
  {
    title: 'Work',
    links: [
     
      { title: 'FYHT4', href: '/work/fyht' },
      { title: 'Housing', href: '/work/housing' },
      { title: 'Taekwondo', href: '/work/taekwondo' },
      
      {
        title: (
          <>
            See all <span aria-hidden="true">&rarr;</span>
          </>
        ),
        href: '/work',
      },
    ],
  },
  {
    title: 'Company',
    links: [
      { title: 'About', href: '/about' },
      { title: 'Process', href: '/process' },
      { title: 'Blog', href: '/blog' },
      { title: 'Contact us', href: '/contact' },
    ],
  },
  {
    title: 'Connect',
    links: socialMediaProfiles,
  },
]

function Navigation() {
  return (
    <nav>
      <ul role="list" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
        {navigation.map((section, sectionIndex) => (
          <li key={sectionIndex}>
            <div className="font-display text-sm font-semibold tracking-wider text-neutral-950">
              {section.title}
            </div>
            <ul role="list" className="mt-4 text-sm text-neutral-700">
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex} className="mt-4">
                  <Link
                    href={link.href}
                    className="transition hover:text-neutral-950"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ArrowIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 6" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 3 10 .5v2H0v1h10v2L16 3Z"
      />
    </svg>
  )
}

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const form = e.currentTarget;                 // the <form>
  const fd = new FormData(form);                // read all fields by name

  const email = (fd.get('email') as string)?.trim();
  const firstName = (fd.get('firstName') as string)?.trim() || undefined;
  const lastName  = (fd.get('lastName') as string)?.trim() || undefined;
  const newsletter = !!fd.get('newsletter');    // checkbox → boolean

  if (!email) {
    alert('Please enter your email.');
    return;
  }

  // Send as multipart/form-data (browser sets headers automatically)
  const res = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: fd,
  });

  if (res.ok) {
    form.reset(); // optional: clear fields
    alert('Thanks! You’re subscribed.');
  } else {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Subscription failed.');
  }
}

function NewsletterForm() {
  return (
    <form
      className="max-w-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="font-display text-sm font-semibold tracking-wider text-neutral-950">
        Sign up for our newsletter
      </h2>
    
      <div className="relative mt-6 space-y-4">
        <input
          type="text"
          name="firstName"
          placeholder="First name"
          autoComplete="given-name"
          aria-label="First name"
          className="block w-full rounded-2xl border border-neutral-300 bg-transparent py-4 pr-6 pl-6 text-base/6 text-neutral-950 ring-4 ring-transparent transition placeholder:text-neutral-500 focus:border-neutral-950 focus:ring-neutral-950/5 focus:outline-hidden"
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last name"
          autoComplete="family-name"
          aria-label="Last name"
          className="block w-full rounded-2xl border border-neutral-300 bg-transparent py-4 pr-6 pl-6 text-base/6 text-neutral-950 ring-4 ring-transparent transition placeholder:text-neutral-500 focus:border-neutral-950 focus:ring-neutral-950/5 focus:outline-hidden"
        />
        <div className="relative">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            autoComplete="email"
            aria-label="Email address"
            className="block w-full rounded-2xl border border-neutral-300 bg-transparent py-4 pr-20 pl-6 text-base/6 text-neutral-950 ring-4 ring-transparent transition placeholder:text-neutral-500 focus:border-neutral-950 focus:ring-neutral-950/5 focus:outline-hidden"
            required
          />
          <div className="absolute inset-y-1 right-1 flex justify-end">
            <button
              type="submit"
              aria-label="Submit"
              className="flex aspect-square h-full items-center justify-center rounded-xl bg-neutral-950 text-white transition hover:bg-neutral-800"
            >
              <ArrowIcon className="w-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export function Footer() {
  return (
    <Container as="footer" className="mt-24 w-full sm:mt-32 lg:mt-40">
      <FadeIn>
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
          <Navigation />
          <div className="flex lg:justify-end">
            <NewsletterForm />
          </div>
        </div>
        <div className="mt-24 mb-20 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-neutral-950/10 pt-12">
          <Link href="/" aria-label="Home">
            <Logo className="h-8" fillOnHover />
          </Link>
          <p className="text-sm text-neutral-700">
            © THE VA CORP. {new Date().getFullYear()}
          </p>
        </div>
      </FadeIn>
    </Container>
  )
}
