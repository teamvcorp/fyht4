// app/api/send-email/route.js
import { Resend } from 'resend';
const apiKey = process.env.RESEND_API_KEY;
const resend = new Resend(apiKey);
export async function POST(request) {
    const { to, subject, html } = await request.json();
    
  try {
    const data = await resend.emails.send({
      from: 'noreply@fyht4.com',
      to,
      subject,
      html,
    });

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
