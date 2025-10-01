import { type Metadata } from 'next'

import { Border } from '@/components/Border'
import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { GridList, GridListItem } from '@/components/GridList'
import { PageIntro } from '@/components/PageIntro'
import { PageLinks } from '@/components/PageLinks'
import { SectionIntro } from '@/components/SectionIntro'
import { StatList, StatListItem } from '@/components/StatList'
import { loadArticles } from '@/lib/mdx'
import { RootLayout } from '@/components/RootLayout'

function Culture() { 
  return (
    <div className="mt-24 rounded-4xl bg-neutral-950 py-24 sm:mt-32 lg:mt-40 lg:py-32">
      <SectionIntro
        eyebrow="Our culture"
        title="Balance your passion with your purpose."
        invert
      >
        <p>
          we are united by a shared commitment to creating change and supporting the communities we serve.
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <GridList>
          <GridListItem title="Loyalty" invert>
            We stand by one another and by the people we fight for, 
            building trust through action and accountability.
          </GridListItem>
          <GridListItem title="Trust" invert>
            We believe in transparency and collaboration, 
            creating space for honesty and shared responsibility.
          </GridListItem>
          <GridListItem title="Compassion" invert>
            We lead with empathy, recognizing that every person’s story and struggle matters.
          </GridListItem>
        </GridList>
      </Container>
    </div>
  )
}

const team = [
  {
    title: 'Leadership',
    people: [
      {
        name: 'Robert Von Der Becke',
        role: 'Co-Founder / CEO',
      },
      {
        name: 'Ryann Von Der Becke',
        role: 'Co-Founder / COO',
      },
    
    ],
  },
  
]

function Team() {
  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <div className="space-y-24">
        {team.map((group) => (
          <FadeInStagger key={group.title}>
            <Border as={FadeIn} />
            <div className="grid grid-cols-1 gap-6 pt-12 sm:pt-16 lg:grid-cols-4 xl:gap-8">
              <FadeIn>
                <h2 className="font-display text-2xl font-semibold text-neutral-950">
                  {group.title}
                </h2>
              </FadeIn>
              <div className="lg:col-span-3">
                <ul
                  role="list"
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8"
                >
                  {group.people.map((person) => (
                    <li key={person.name}>
                      <FadeIn>
                        <div className="group relative overflow-hidden rounded-3xl bg-neutral-100">
                          <div className="h-96 w-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                            <div className="text-6xl text-neutral-400">
                              {person.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>
                          <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black to-black/0 to-40% p-6">
                            <p className="font-display text-base/6 font-semibold tracking-wide text-white">
                              {person.name}
                            </p>
                            <p className="mt-2 text-sm text-white">
                              {person.role}
                            </p>
                          </div>
                        </div>
                      </FadeIn>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeInStagger>
        ))}
      </div>
    </Container>
  )
}

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Fyght4 believes in the power of collective action, amplifying voices, and building solidarity to create meaningful pathways for dignity and opportunity.',
}

export default async function About() {
  let blogArticles = (await loadArticles()).slice(0, 2)

  return (
    <RootLayout>
      <PageIntro eyebrow="About us" title="Our strength is community">
        <p>
          We are deidicated to amplifying voices, building solidarity, and creating meaningful pathways for fairness and inclusion.
        </p>
        <div className="mt-10 max-w-2xl space-y-6 text-base">
          <p>
            What began as a small group of people determined to challenge the status quo has grown into a movement that connects 
            communities, organizations, and individuals who share the same vision: a fairer, more compassionate world.

            At Fyght4, we believe in transparency, collaboration, and action. Every project we take on is rooted in listening to those 
            most affected and working side by side to create solutions that matter.
          </p>
          <p>
            At Fyght4, we stand for empowering communities through education and advocacy, building networks that strengthen resilience 
            and solidarity, and driving change with creativity, persistence, and compassion.
          </p>
        </div>
      </PageIntro>
      <Container className="mt-16">
        <StatList>
          <StatListItem value="35+" label="Community Partners" />
          <StatListItem value="50+" label="Campains Launched" />
          <StatListItem value="Thousands & Growing" label="People Reached" />
        </StatList>
      </Container>

      <Culture />

      <Team />

      <PageLinks
        className="mt-24 sm:mt-32 lg:mt-40"
        title="From the blog"
        intro="Our team is dedicated to sharing stories, insights, and strategies that inspire action and strengthen communities. From highlighting local movements to exploring creative approaches to advocacy, our blog is a space to learn, connect, and spark change."
        pages={blogArticles}
      />

      <ContactSection />
    </RootLayout>
  )
}
