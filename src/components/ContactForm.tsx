'use client'
import { FadeIn } from '@/components/FadeIn'
import { Button } from '@/components/Button'
import { useState, ChangeEvent, FormEvent } from 'react'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactFormData = z.infer<typeof contactSchema>

function TextInput({
  label,
  register,
  error,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { 
  label: string
  register: any
  error?: string
}) {
  let id = useId()

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <input
        id={id}
        {...register}
        {...props}
        placeholder=" "
        className={`peer block w-full border bg-transparent px-6 pt-12 pb-4 text-base/6 text-neutral-950 ring-4 ring-transparent transition group-first:rounded-t-2xl group-last:rounded-b-2xl focus:outline-hidden ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/5' 
            : 'border-neutral-300 focus:border-neutral-950 focus:ring-neutral-950/5'
        }`}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute top-1/2 left-6 -mt-3 origin-left text-base/6 transition-all duration-200 peer-not-placeholder-shown:-translate-y-4 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:font-semibold peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold ${
          error 
            ? 'text-red-500 peer-not-placeholder-shown:text-red-600 peer-focus:text-red-600'
            : 'text-neutral-500 peer-not-placeholder-shown:text-neutral-950 peer-focus:text-neutral-950'
        }`}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-600 px-6">{error}</p>
      )}
    </div>
  )
}

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'admin@thevacorp.com',
          subject: `New Contact Form Submission from ${data.name}`,
          html: `
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Company:</strong> ${data.company || 'N/A'}</p>
            <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
            <p><strong>Message:</strong><br/>${data.message}</p>
          `,
        }),
      })

      const result = await res.json()
      if (result.success) {
        toast.success('Message sent successfully!')
        reset()
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    }
  }

  return (
    <FadeIn className="lg:order-last">
      <form onSubmit={handleSubmit(onSubmit)}>
        <h2 className="font-display text-base font-semibold text-neutral-950">Inquiries</h2>
        <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
          <TextInput 
            label="Name" 
            register={register('name')}
            error={errors.name?.message}
          />
          <TextInput 
            label="Email" 
            type="email"
            register={register('email')}
            error={errors.email?.message}
          />
          <TextInput 
            label="Company" 
            register={register('company')}
            error={errors.company?.message}
          />
          <TextInput 
            label="Phone" 
            type="tel"
            register={register('phone')}
            error={errors.phone?.message}
          />
          <TextInput 
            label="Message" 
            register={register('message')}
            error={errors.message?.message}
          />
        </div>
        <Button 
          type="submit" 
          className="mt-10"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : "Let's work together"}
        </Button>
      </form>
    </FadeIn>
  )
}
