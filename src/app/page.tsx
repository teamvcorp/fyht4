import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { List, ListItem } from '@/components/List'
import { SectionIntro } from '@/components/SectionIntro'
import { StylizedImage } from '@/components/StylizedImage'
import { Testimonial } from '@/components/Testimonial'
import BrightlandLogoColor from '@/images/clients/brightland/brightlandLogo.png'
import TKDColorLogo from '@/images/clients/Taekwondo/taekwondoLogo.png'
import SantaLogo from '@/images/clients/santa/santaLogo.png'
import CRFCLogo from '@/images/clients/crossroad/crossroadLogo.png'
import Fyht4LogoLite from '@/images/clients/fight/fightLogo.png'
import imageFam from '@/images/fam.png'
import { type CaseStudy, type MDXEntry, loadCaseStudies } from '@/lib/mdx'
import { WalletFundingSection } from '@/components/WalletFundingSection'
import { RootLayout } from '@/components/RootLayout'

const clients = [
  ['Taekwondo', TKDColorLogo],
  ['Brightland', BrightlandLogoColor],
  ['Santa', SantaLogo],
  ['CRFC', CRFCLogo],
  ['FYHT4', Fyht4LogoLite],

]

function Clients() {
  return (
    <div className="mt-24 rounded-4xl bg-neutral-950 py-20 sm:mt-32 sm:py-32 lg:mt-56">
      <Container>
        <FadeIn className="flex items-center gap-x-8">
          <h2 className="text-center font-display text-sm font-semibold tracking-wider text-white sm:text-left">
            We have worked with thousands of amazing people
          </h2>
          <div className="h-px flex-auto bg-neutral-800" />
        </FadeIn>
        <FadeInStagger faster>
          <ul
            role="list"
            className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4"
          >
            {clients.map(([client, logo]) => (
              <li key={String(client)}>
                <FadeIn>
                  <Image
                    src={logo}
                    alt={typeof client === 'string' ? client : ''}
                    unoptimized
                    className="max-w-[100px] max-h-[100px]"
                  />
                </FadeIn>
              </li>
            ))}
          </ul>
        </FadeInStagger>
      </Container>
    </div>
  )
}

function CaseStudies({
  caseStudies,
}: {
  caseStudies: Array<MDXEntry<CaseStudy>>
}) {
  return (
    <>
      <SectionIntro
        title="Leveraging income to reduce inequality."
        eyebrow="Benefits"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          We believe that everyone should have access to the same opportunities, regardless of their background or circumstances. Our projects showcase how we have helped families achieve this goal through innovative solutions and a commitment to social responsibility.
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <FadeInStagger className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {caseStudies.map((caseStudy) => (
            <FadeIn key={caseStudy.href} className="flex">
              <article className="relative flex w-full flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 transition hover:bg-neutral-50 sm:p-8">
                <h3>
                  <Link href={caseStudy.href}>
                    <span className="absolute inset-0 rounded-3xl" />
                    <Image
                      src={caseStudy.logo}
                      alt={caseStudy.client}
                      className="h-16 w-16"
                      unoptimized
                    />
                  </Link>
                </h3>
                <p className="mt-6 flex gap-x-2 text-sm text-neutral-950">
                  <time
                    dateTime={caseStudy.date.split('-')[0]}
                    className="font-semibold"
                  >
                    {caseStudy.date.split('-')[0]}
                  </time>
                  <span className="text-neutral-300" aria-hidden="true">
                    /
                  </span>
                  <span>Partner</span>
                </p>
                <p className="mt-6 font-display text-2xl font-semibold text-neutral-950">
                  {caseStudy.title}
                </p>
                <p className="mt-4 text-base text-neutral-600">
                  {caseStudy.description}
                </p>
              </article>
            </FadeIn>
          ))}
        </FadeInStagger>
      </Container>
    </>
  )
}

function Services() {
  return (
    <>
      <SectionIntro
        eyebrow="Services"
        title="We meet real needs with real-world solutions."
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Our mission is to uplift the community through access to technology, wellness,
          nutrition, and behavioral support — blending innovation with compassion.
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <div className="lg:flex lg:items-center lg:justify-end">
          <div className="flex justify-center lg:w-1/2 lg:justify-end lg:pr-12">
            <FadeIn className="w-135 flex-none lg:w-180">
              <StylizedImage
                src={imageFam}
                sizes="(min-width: 1024px) 41rem, 31rem"
                className="justify-center lg:justify-end"
              />
            </FadeIn>
          </div>
          <List className="mt-16 lg:mt-0 lg:w-1/2 lg:min-w-132 lg:pl-4">
            <ListItem title="Tech Education & Outreach">
              We provide affordable website development, AI integration, youth coding programs,
              and small business tech support — helping our community thrive in a digital world.
            </ListItem>
            <ListItem title="Behavioral Growth through Storm Lake Taekwondo">
              We use martial arts training to promote discipline, respect, and confidence in youth,
              while offering supportive leadership opportunities for families and teens.
            </ListItem>
            <ListItem title="Food Access through Alley Burger">
              More than a restaurant — Alley Burger serves as a food access point, creating
              nutritious, affordable options while funding outreach programs and youth employment.
            </ListItem>
            <ListItem title="Family Connection through SOS (Spirit of Santa)">
              SOS promotes behavioral and emotional development during the holidays and beyond,
              by helping families reconnect through joy, giving, and acts of community kindness.
            </ListItem>
            <ListItem title="Family Wellness through Crossroad Family Center">
              The CRFC offers fitness, behavioral health, nutrition, and life skills programs
              to support long-term well-being for individuals and families in our region.
            </ListItem>
            <ListItem title="Family Safety and Security through Brightland Properties.">
              Keeping families in stable housing with utilities by using effort-based economic solutions that value service and community participation over income alone.
            </ListItem>
          </List>
        </div>
      </Container>
    </>
  )
}


export const metadata: Metadata = {
  description:
    'Join FYHT4 Change to propose, vote on, and fund community projects. Democratic decision-making for local change.',
}

export default async function Home() {
  let caseStudies = (await loadCaseStudies()).slice(0, 3)

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32 md:mt-56">
        <FadeIn className="max-w-3xl text-center mx-auto">
          <h1 className="font-display text-5xl font-bold tracking-tight text-neutral-950 sm:text-7xl">
            Fight 4 Change: A World Where Effort Unlocks Opportunity
          </h1>
          <p className="mt-6 text-xl text-neutral-600 leading-relaxed">
            Join us in building a future where shelter, food, healthcare, and education
            aren’t privileges—they’re rights. No credit checks. No red tape.
            Just fairness, dignity, and action. Your effort—and your support—make it possible.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/membership"
              className="rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-emerald-700 transition transform hover:scale-105"
            >
              Join the Movement
            </a>
            <a
              href="/projects"
              className="rounded-2xl border border-neutral-300 px-8 py-4 text-lg font-semibold text-neutral-700 hover:border-neutral-500 hover:bg-neutral-50 transition"
            >
              Explore Projects
            </a>
          </div>
          
          {/* Quick stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-600">100%</div>
              <div className="text-sm text-neutral-600">Community Driven</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">ZIP</div>
              <div className="text-sm text-neutral-600">Code Democracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">0</div>
              <div className="text-sm text-neutral-600">Red Tape</div>
            </div>
          </div>
        </FadeIn>
      </Container>

      <WalletFundingSection />

      <CaseStudies caseStudies={caseStudies} />

   

      <Services />

      <ContactSection />
    </RootLayout>
  )
}
