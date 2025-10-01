// API endpoint for triggering welcome email sequence
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || 'FYHT4 <welcome@fyht4.com>'

export async function POST(req: NextRequest) {
  if (!resend) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  try {
    const { email, name, type = 'welcome' } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    let subject = ''
    let html = ''

    switch (type) {
      case 'welcome':
        subject = 'Welcome to FYHT4 - Your community awaits! 🏘️'
        html = welcomeEmailHTML({ name })
        break
      
      case 'first_week':
        subject = 'Discover projects in your area'
        html = firstWeekEmailHTML({ name })
        break
      
      case 'engagement':
        subject = 'Your neighbors need your voice'
        html = engagementEmailHTML({ name })
        break
        
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    const result = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
    })

    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

function welcomeEmailHTML({ name }: { name?: string }) {
  return `
    <div style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to FYHT4! 🎉</h1>
        <p style="color: #d1fae5; margin: 16px 0 0 0; font-size: 18px;">${name ? `Hi ${name}, you're` : "You're"} now part of something bigger</p>
      </div>
      
      <div style="background: white; padding: 40px 20px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 24px 0; font-size: 16px;">You just joined a community that believes <strong>effort should unlock opportunity</strong> - where neighbors work together to solve real problems.</p>
        
        <div style="background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px;">Here's how it works:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Propose:</strong> Submit ideas for your community</li>
            <li style="margin-bottom: 8px;"><strong>Vote:</strong> Choose what gets built in your ZIP code</li>
            <li style="margin-bottom: 8px;"><strong>Fund:</strong> Support projects you believe in</li>
            <li style="margin-bottom: 0;"><strong>Build:</strong> Watch ideas become reality</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://fyht4.com/projects" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Explore Projects in Your Area</a>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280;">Questions? Just reply to this email - we're here to help!</p>
      </div>
    </div>
  `
}

function firstWeekEmailHTML({ name }: { name?: string }) {
  return `
    <div style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto;">
      <div style="background: white; padding: 40px 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Ready to make an impact? 🚀</h2>
        
        <p style="margin: 0 0 24px 0;">${name ? `Hi ${name}!` : 'Hi!'} You've been a FYHT4 member for a week. Have you discovered what's happening in your community yet?</p>

        <div style="background: #f0fdf4; border: 2px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #059669;">💡 Quick Start Ideas:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #166534;">
            <li>Browse projects by your ZIP code</li>
            <li>Vote on 1-2 projects you care about</li>
            <li>Share a project with a neighbor</li>
            <li>Submit your own idea if you have one</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://fyht4.com/projects?sort=zipcode" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin-right: 12px;">Find Local Projects</a>
          <a href="https://fyht4.com/projects/submit" style="background: transparent; color: #059669; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; border: 2px solid #059669;">Submit an Idea</a>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;"><em>Every voice matters. Every vote counts.</em></p>
      </div>
    </div>
  `
}

function engagementEmailHTML({ name }: { name?: string }) {
  return `
    <div style="font-family: Inter, system-ui, -apple-system, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto;">
      <div style="background: white; padding: 40px 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 24px;">Your neighbors are waiting for your vote 🗳️</h2>
        
        <p style="margin: 0 0 24px 0;">${name ? `Hi ${name},` : 'Hi,'} there are active projects in your area that need community input. Your vote could be the one that moves them forward!</p>

        <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #92400e;">📊 Did you know?</h3>
          <p style="margin: 0; color: #92400e;">Projects with high community engagement are 3x more likely to get fully funded and completed successfully.</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="https://fyht4.com/projects?status=voting" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Projects Needing Votes</a>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">Takes 2 minutes. Makes a lifetime of difference.</p>
      </div>
    </div>
  `
}