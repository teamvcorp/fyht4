'use client'
import { FadeIn } from '@/components/FadeIn'
import { Button } from '@/components/Button'
import { useState, ChangeEvent, FormEvent } from 'react'
import { useId } from 'react'
// ... your ContactForm logicimport { Button } from '@/components/Button'


function TextInput({
  label,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  let id = useId()

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <input
        type="text"
        id={id}
        {...props}
        placeholder=" "
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pt-12 pb-4 text-base/6 text-neutral-950 ring-4 ring-transparent transition group-first:rounded-t-2xl group-last:rounded-b-2xl focus:border-neutral-950 focus:ring-neutral-950/5 focus:outline-hidden"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute top-1/2 left-6 -mt-3 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-not-placeholder-shown:-translate-y-4 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-neutral-950 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950"
      >
        {label}
      </label>
    </div>
  )
}

export default function ContactForm() {
    {
      const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        message: '',
      })
    
      const [status, setStatus] = useState<string | null>(null)
    
      const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
      }
    
      const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setStatus('Sending...')
    
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'admin@thevacorp.com',
            subject: `New Contact Form Submission from ${formData.name}`,
            html: `
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Company:</strong> ${formData.company}</p>
              <p><strong>Phone:</strong> ${formData.phone}</p>
              <p><strong>Message:</strong><br/>${formData.message}</p>
            `,
          }),
        })
    
        const result = await res.json()
        if (result.success) {
          setStatus('✅ Message sent successfully!')
          setFormData({ name: '', email: '', company: '', phone: '', message: '' })
        } else {
          setStatus(`❌ Error: ${result.error}`)
        }
      }
    
      return (
        <FadeIn className="lg:order-last">
          <form onSubmit={handleSubmit}>
            <h2 className="font-display text-base font-semibold text-neutral-950">Inquiries</h2>
            <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
              <TextInput label="Name" name="name" value={formData.name} onChange={handleChange} />
              <TextInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
              <TextInput label="Company" name="company" value={formData.company} onChange={handleChange} />
              <TextInput label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
              <TextInput label="Message" name="message" value={formData.message} onChange={handleChange} />
            </div>
            <Button type="submit" className="mt-10">
              Let&apos;s work together
            </Button>
            {status && <p className="mt-4 text-sm text-neutral-700">{status}</p>}
          </form>
        </FadeIn>
      )
    }
    
 }
