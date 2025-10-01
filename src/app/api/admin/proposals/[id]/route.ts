// src/app/api/admin/proposals/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getAdminOrResponse } from '@/lib/guard'
import mongoose from 'mongoose'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM_EMAIL || 'FYHT4 <no-reply@fyht4.com>'

function approvalEmailHTML({
  name, title, zipcode, voteGoal, fundingGoalDollars, url,
}: {
  name?: string | null
  title: string
  zipcode: string
  voteGoal: number
  fundingGoalDollars: string
  url: string
}) {
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.55">
    <h2 style="margin:0 0 8px 0">Your project was approved 🎉</h2>
    <p style="margin:0 0 12px 0">${name ? `Hi ${name},` : 'Hi,'} your proposal <strong>${title}</strong> (ZIP ${zipcode}) has been approved and is now live for community voting.</p>
    <ul style="padding-left:18px;margin:0 0 12px 0">
      <li>Vote goal: <strong>${voteGoal}</strong></li>
      <li>Funding goal: <strong>$${fundingGoalDollars}</strong></li>
    </ul>
    <p style="margin:0 0 16px 0">Share the page and encourage neighbors to vote and donate:</p>
    <p><a href="${url}" style="background:#111827;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;display:inline-block">View Project</a></p>
    <p style="margin-top:16px;color:#6b7280;font-size:12px">FYHT4</p>
  </div>`
}

function rejectionEmailHTML({
  name, title, notes,
}: {
  name?: string | null
  title: string
  notes?: string
}) {
  return `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.55">
    <h2 style="margin:0 0 8px 0">Project decision: not approved</h2>
    <p style="margin:0 0 12px 0">${name ? `Hi ${name},` : 'Hi,'} thanks for your proposal <strong>${title}</strong>. After review, we weren't able to approve it this time.</p>
    ${
      notes
        ? `<p style="margin:0 0 12px 0"><strong>Notes from the review team:</strong><br/>${notes
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>')}</p>`
        : ''
    }
    <p style="margin:0 0 12px 0">We encourage you to revise and resubmit in the future.</p>
    <p style="margin-top:16px;color:#6b7280;font-size:12px">FYHT4</p>
  </div>`
}

async function sendEmailSafe(args: { to?: string | null; subject: string; html: string }) {
  if (!resend || !args.to) return
  try {
    await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    })
  } catch (e) {
    console.error('Resend email failed:', e)
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // params must be awaited
) {
  const admin = await getAdminOrResponse()
  if (admin instanceof Response) return admin

  const { id } = await ctx.params

  const db = (await clientPromise).db()
  const body = await req.json().catch(() => ({}))
  const { action, adminNotes } = body as { action: 'approve' | 'reject'; adminNotes?: string }

  const prop = await db
    .collection('project_proposals')
    .findOne({ _id: new mongoose.Types.ObjectId(id) })

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Submitter for notification
  const submitter = prop.createdBy
    ? await db
        .collection('users')
        .findOne({ _id: new mongoose.Types.ObjectId(prop.createdBy) }, { projection: { email: 1, name: 1 } })
    : null

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${new URL(req.url).protocol}//${new URL(req.url).host}`

  if (action === 'reject') {
    await db
      .collection('project_proposals')
      .updateOne(
        { _id: prop._id },
        { $set: { status: 'rejected', adminNotes: adminNotes || '' } },
      )

    await sendEmailSafe({
      to: submitter?.email,
      subject: `FYHT4 – Proposal not approved: ${prop.title}`,
      html: rejectionEmailHTML({
        name: submitter?.name,
        title: prop.title,
        notes: adminNotes,
      }),
    })

    return NextResponse.json({ ok: true })
  }

  if (action === 'approve') {
    const proj = {
      title: prop.title,
      category: prop.category,
      zipcode: String(prop.zipcode),
      shortDescription: prop.shortDescription || '',
      description: prop.description || '',
      fundingGoal: Number(prop.fundingGoal || 0),
      totalRaised: 0,
      voteGoal: Number(prop.voteGoal || 0),
      votesYes: 0,
      votesNo: 0,
      status: 'voting' as const,
      createdBy: prop.createdBy || null,
      createdAt: new Date(),
      approvedAt: new Date(),
      votingOpenedAt: new Date(),
      coverImage: null,
      adminVerifiedComplete: false,
    }

    const created = await db.collection('projects').insertOne(proj)

    await db
      .collection('project_proposals')
      .updateOne(
        { _id: prop._id },
        {
          $set: {
            status: 'approved',
            adminNotes: adminNotes || '',
            projectId: created.insertedId,
          },
        },
      )

    const projectUrl = `${site}/projects/${String(created.insertedId)}`
    const fundingGoalDollars = ((proj.fundingGoal || 0) / 100).toLocaleString()

    await sendEmailSafe({
      to: submitter?.email,
      subject: `FYHT4 – Your project is live: ${prop.title}`,
      html: approvalEmailHTML({
        name: submitter?.name,
        title: prop.title,
        zipcode: String(prop.zipcode),
        voteGoal: proj.voteGoal,
        fundingGoalDollars,
        url: projectUrl,
      }),
    })

    return NextResponse.json({ ok: true, projectId: String(created.insertedId) })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
