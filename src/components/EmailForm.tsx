'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

interface EmailFormData {
  to: string;
  subject: string;
  message: string;
}

export default function EmailPage() {
  const [formData, setFormData] = useState<EmailFormData>({
    to: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          html: `<p>${formData.message}</p>`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus('✅ Email sent successfully!');
        setFormData({ to: '', subject: '', message: '' });
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      setStatus('❌ An unexpected error occurred.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 mt-10 border rounded-xl shadow-md bg-white">
      <h1 className="text-2xl font-bold mb-4">Send an Email</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="to"
          placeholder="Recipient Email"
          value={formData.to}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="subject"
          placeholder="Subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <textarea
          name="message"
          placeholder="Your message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Send Email
        </button>
      </form>
      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
