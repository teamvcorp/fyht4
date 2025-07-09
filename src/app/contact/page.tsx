'use client'
// import { type Metadata } from 'next'
import Link from 'next/link'
import ContactForm from '@/components/ContactForm'
import { Border } from '@/components/Border'
// import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Offices } from '@/components/Offices'
import { PageIntro } from '@/components/PageIntro'
import { SocialMedia } from '@/components/SocialMedia'
import { RootLayout } from '@/components/RootLayout'


function RadioInput({
  label,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  return (
    <label className="flex gap-x-3">
      <input
        type="radio"
        {...props}
        className="h-6 w-6 flex-none appearance-none rounded-full border border-neutral-950/20 outline-hidden checked:border-[0.5rem] checked:border-neutral-950 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      />
      <span className="text-base/6 text-neutral-950">{label}</span>
    </label>
  )
}

// export function ContactForm() {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     company: '',
//     phone: '',
//     message: '',
//   })

//   const [status, setStatus] = useState<string | null>(null)

//   const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value })
//   }

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault()
//     setStatus('Sending...')

//     const res = await fetch('/api/send-email', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         to: 'admin@thevacorp.com',
//         subject: `New Contact Form Submission from ${formData.name}`,
//         html: `
//           <p><strong>Name:</strong> ${formData.name}</p>
//           <p><strong>Email:</strong> ${formData.email}</p>
//           <p><strong>Company:</strong> ${formData.company}</p>
//           <p><strong>Phone:</strong> ${formData.phone}</p>
//           <p><strong>Message:</strong><br/>${formData.message}</p>
//         `,
//       }),
//     })

//     const result = await res.json()
//     if (result.success) {
//       setStatus('✅ Message sent successfully!')
//       setFormData({ name: '', email: '', company: '', phone: '', message: '' })
//     } else {
//       setStatus(`❌ Error: ${result.error}`)
//     }
//   }

//   return (
//     <FadeIn className="lg:order-last">
//       <form onSubmit={handleSubmit}>
//         <h2 className="font-display text-base font-semibold text-neutral-950">Inquiries</h2>
//         <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
//           <TextInput label="Name" name="name" value={formData.name} onChange={handleChange} />
//           <TextInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
//           <TextInput label="Company" name="company" value={formData.company} onChange={handleChange} />
//           <TextInput label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
//           <TextInput label="Message" name="message" value={formData.message} onChange={handleChange} />
//         </div>
//         <Button type="submit" className="mt-10">
//           Let&apos;s work together
//         </Button>
//         {status && <p className="mt-4 text-sm text-neutral-700">{status}</p>}
//       </form>
//     </FadeIn>
//   )
// }

function ContactDetails() {
  return (
    <FadeIn>
      <h2 className="font-display text-base font-semibold text-neutral-950">
        Our offices
      </h2>
      <p className="mt-6 text-base text-neutral-600">
        Prefer doing things in person? Stop by and say hello at one of our offices.
      </p>

      <Offices className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2" />

      <Border className="mt-16 pt-16">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          Email us
        </h2>
        <dl className="mt-6 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2">
          {[
            ['Careers', 'admin@thevacorp.com'],
            ['Press', 'teamvcorp@gmail.com'],
          ].map(([label, email]) => (
            <div key={email}>
              <dt className="font-semibold text-neutral-950">{label}</dt>
              <dd>
                <Link
                  href={`mailto:${email}`}
                  className="text-neutral-600 hover:text-neutral-950"
                >
                  {email}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </Border>

      <Border className="mt-16 pt-16">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          Follow us
        </h2>
        <SocialMedia className="mt-6" />
      </Border>
    </FadeIn>
  )
}


export default function Contact() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Contact us" title="Let&apos;s work together">
        <p>We can&apos;t wait to hear from you.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-x-8 gap-y-24 lg:grid-cols-2">
          <ContactForm />
          <ContactDetails />
        </div>
      </Container>
    </RootLayout>
  )
}
