import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SectionIntro } from '@/components/SectionIntro'
import { GridList, GridListItem } from '@/components/GridList'
import { RootLayout } from '@/components/RootLayout'

// NEW: client components
import DonateCtas from '@/components/donate/DonateCtas'
import DonationTiers from '@/components/donate/DonationTiers'


function ProcessHighlight() {
  return (
    <Container className="mt-24">
      <SectionIntro
        eyebrow="How it works"
        title="Simple. Transparent. Community-led."
      >
        <p>
          Members propose projects, communities vote by ZIP code, and funded builds are delivered with transparent updates.
        </p>
      </SectionIntro>
      <GridList className="mt-10">
        <GridListItem title="Propose & Vote">
          Members surface needs and vote locally to prioritize what matters most.
        </GridListItem>
        <GridListItem title="Fund What’s Chosen">
          Donations and dues fund approved projects—no red tape.
        </GridListItem>
        <GridListItem title="Build & Report">
          We deliver, track outcomes, and publish results for accountability.
        </GridListItem>
      </GridList>
    </Container>
  )
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Trust band (optional but recommended for conversions)
 *  ---------------------------------------------------------------------------*/
function TrustBand() {
  return (
    <Container className="mt-24">
      <div className="rounded-3xl bg-neutral-50 border border-neutral-200 p-6 sm:p-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-neutral-600">
            Secure payments via Stripe • Tax-deductible where applicable • Quarterly impact updates to all recurring donors
          </p>
        </div>
      </div>
    </Container>
  )
}

/** ────────────────────────────────────────────────────────────────────────────
 *  FAQ (keep it tight)
 *  ---------------------------------------------------------------------------*/
function Faq() {
  const qa = [
    {
      q: 'Is my donation tax-deductible?',
      a: 'Yes, if FYHT4 is a registered 501(c)(3) in your jurisdiction. Your receipt will indicate tax information for your records.',
    },
    {
      q: 'What’s the difference between donating and becoming a member?',
      a: 'Donations fund projects. Membership includes voting, proposing projects, and ongoing impact briefings—plus all the benefits of donors.',
    },
    {
      q: 'Can I cancel or change my monthly gift?',
      a: 'Absolutely. You can manage or cancel your monthly plan anytime from your receipt link or by contacting support.',
    },
  ]
  return (
    <Container className="mt-24">
      <SectionIntro eyebrow="FAQ" title="Good questions. Quick answers." />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {qa.map(item => (
          <div key={item.q} className="rounded-2xl border border-neutral-200 p-5 bg-white">
            <p className="font-semibold text-neutral-900">{item.q}</p>
            <p className="mt-2 text-neutral-700 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </Container>
  )
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Metadata
 *  ---------------------------------------------------------------------------*/
export const metadata: Metadata = {
  title: 'Donate & Membership',
  description:
    'Support FYHT4’s community-led projects. Donate once, give monthly, or become a member and help decide what gets built.',
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Page
 *  ---------------------------------------------------------------------------*/
export default function Donate() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Donate" title="Back the work. Shape the outcome.">
        <p>
          Donate to accelerate delivery—or become a member to help decide what gets built. Either way, you’re fueling
          fair access to housing, food, health, and education.
        </p>
      </PageIntro>

      <DonateCtas />
      <DonationTiers />
      <ProcessHighlight />
      <TrustBand />
      {/* If you want it even tighter, you can remove FAQ */}
      <Faq />
    </RootLayout>
  )
}
