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
import HomeSchoolLogo from '@/images/clients/homeschool/homeschoolLogo.png'
import imageFam from '@/images/fam.png'
import { type CaseStudy, type MDXEntry, loadCaseStudies } from '@/lib/mdx'
import { RootLayout } from '@/components/RootLayout'

const clients = [
  ['Taekwondo', TKDColorLogo],
  ['Brightland', BrightlandLogoColor],
  ['Santa', SantaLogo],
  ['CRFC', CRFCLogo],
  ['FYHT4', Fyht4LogoLite],
  ['Homeschool', HomeSchoolLogo],
 
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
          We believe that everyone should have access to the same opportunities, regardless of their background or circumstances. Our projects showcase how we have helped familes achieve this goal through innovative solutions and a commitment to social responsibility.
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
                  <span>Case study</span>
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
    'We are a development studio working at the intersection of society and education.',
}

export default async function Home() {
  let caseStudies = (await loadCaseStudies()).slice(0, 3)

  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32 md:mt-56">
        <FadeIn className="max-w-3xl">
          <h1 className="font-display text-5xl font-medium tracking-tight text-balance text-neutral-950 sm:text-7xl">
            Effortonomy, where human rights meets direct action.
          </h1>
          <p className="mt-6 text-xl text-neutral-600">
            Put your voice and your resources to work for you.  We are building a society that rewards people based on effort, no credit checks, no complex approvals, just a world where eveyone has equal access to shelter, food, healthcare, and education.If you want to be heard and have a fair shot, join us in the fight for Effortonomy.
          </p>
        </FadeIn>
      </Container>

      <Clients />

      <CaseStudies caseStudies={caseStudies} />

      <Testimonial
        className="mt-24 sm:mt-32 lg:mt-40"
        client={{ name: 'tkd', logo: TKDColorLogo }}
      >
        TeamVCorp is fully commited to social change leading they way with programs that educate and guide postive behaviors and actions. Their work is a testament to the power of community and the impact of collective effort. We are proud to be part of this movement.
      </Testimonial>

      <Services />

      <ContactSection />
    </RootLayout>
  )
}
