import { type Metadata } from 'next'

import { Blockquote } from '@/components/Blockquote'
import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { GridList, GridListItem } from '@/components/GridList'
import { GridPattern } from '@/components/GridPattern'
import { List, ListItem } from '@/components/List'
import { PageIntro } from '@/components/PageIntro'
import { SectionIntro } from '@/components/SectionIntro'
import { StylizedImage } from '@/components/StylizedImage'
import { TagList, TagListItem } from '@/components/TagList'
import imageBuild from '@/images/build.png'
import imageDeliver from '@/images/deliver.png'
import imageDiscover from '@/images/discover.png'
import { RootLayout } from '@/components/RootLayout'

function Section({
  title,
  image,
  children,
}: {
  title: string
  image: React.ComponentPropsWithoutRef<typeof StylizedImage>
  children: React.ReactNode
}) {
  return (
    <Container className="group/section [counter-increment:section]">
      <div className="lg:flex lg:items-center lg:justify-end lg:gap-x-8 lg:group-even/section:justify-start xl:gap-x-20">
        <div className="flex justify-center">
          <FadeIn className="w-135 flex-none lg:w-180">
            <StylizedImage
              {...image}
              sizes="(min-width: 1024px) 41rem, 31rem"
              className="justify-center lg:justify-end lg:group-even/section:justify-start"
            />
          </FadeIn>
        </div>
        <div className="mt-12 lg:mt-0 lg:w-148 lg:flex-none lg:group-even/section:order-first">
          <FadeIn>
            <div
              className="font-display text-base font-semibold before:text-neutral-300 before:content-['/_'] after:text-neutral-950 after:content-[counter(section,decimal-leading-zero)]"
              aria-hidden="true"
            />
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl">
              {title}
            </h2>
            <div className="mt-6">{children}</div>
          </FadeIn>
        </div>
      </div>
    </Container>
  )
}

function Discover() {
  return (
    <Section title="Discover" image={{ src: imageDiscover }}>
      <div className="space-y-6 text-base text-neutral-600">
        <p>
          At FYHT4, discovery starts with the community. Every member is invited to submit project ideas that address needs in one of our focus areas:{" "}
          <strong className="font-semibold text-neutral-950">education, health and well-being, or housing</strong>.
        </p>
        <p>
          If a project earns enough votes from neighbors in the submitter’s zip code, it advances to a wider approval stage—gathering votes across the local, state, or national level depending on the scope. Once a majority of affected areas vote yes, we move forward. No bureaucracy. Just action.
        </p>
      </div>

      <h3 className="mt-12 font-display text-base font-semibold text-neutral-950">
        Included in this phase
      </h3>
      <TagList className="mt-4">
        <TagListItem>Member-driven proposals</TagListItem>
        <TagListItem>Zip code-level voting</TagListItem>
        <TagListItem>Focus area alignment</TagListItem>
        <TagListItem>Transparent approval process</TagListItem>
        <TagListItem>Community impact tracking</TagListItem>
      </TagList>
    </Section>
  );
}


function Build() {
  return (
    <Section title="Build" image={{ src: imageBuild, shape: 1 }}>
      <div className="space-y-6 text-base text-neutral-600">
        <p>
          Once a project is approved through community voting, we move into action—building solutions that reflect the will and needs of the people. Each project is grounded in one of our core areas:{" "}
          <strong className="font-semibold text-neutral-950">education, health and well-being, or housing</strong>.
        </p>
        <p>
          Local coordinators work directly with community members, partners, and contributors to ensure the project is delivered effectively and efficiently. Transparency and accountability are built into every step.
        </p>
        <p>
          Because every approved project represents a collective choice, we prioritize communication, impact tracking, and progress updates—making sure every vote leads to visible change.
        </p>
      </div>

      <Blockquote
        author={{ name: 'Debra Fiscal', role: 'FYHT4 Participant' }}
        className="mt-12"
      >
        “I never thought I’d see something like this actually happen in my town—until FYHT4 made it real.”
      </Blockquote>
    </Section>
  );
}


function Deliver() {
  return (
    <Section title="Deliver" image={{ src: imageDeliver, shape: 2 }}>
      <div className="space-y-6 text-base text-neutral-600">
        <p>
          When a project reaches the delivery phase, it's more than just a launch—it’s a milestone for the community. We ensure every build is completed with care, accountability, and local follow-through.
        </p>
        <p>
          Project leads coordinate with partners and community members to finalize implementation and handoff, making sure it’s not only functional but sustainable. We don’t just deliver projects—we deliver ownership and pride.
        </p>
        <p>
          From groundbreaking to grand opening, we stay present through the final steps, verifying quality, tracking outcomes, and supporting the people the project was built for.
        </p>
      </div>

      <h3 className="mt-12 font-display text-base font-semibold text-neutral-950">
        Included in this phase
      </h3>
      <List className="mt-8">
        <ListItem title="Quality Assurance">
          Every project is reviewed for durability, impact, and adherence to community goals.
        </ListItem>
        <ListItem title="Community Training">
          We empower local residents with the tools and knowledge to maintain what’s been built.
        </ListItem>
        <ListItem title="Ongoing Support">
          Our team remains engaged post-launch to monitor impact and provide continued guidance.
        </ListItem>
      </List>
    </Section>
  );
}

function Values() {
  return (
    <div className="relative mt-24 pt-24 sm:mt-32 sm:pt-32 lg:mt-40 lg:pt-40">
      <div className="absolute inset-x-0 top-0 -z-10 h-[884px] overflow-hidden rounded-t-4xl bg-linear-to-b from-neutral-50">
        <GridPattern
          className="absolute inset-0 h-full w-full mask-[linear-gradient(to_bottom_left,white_40%,transparent_50%)] fill-neutral-100 stroke-neutral-950/5"
          yOffset={-270}
        />
      </div>

      <SectionIntro
        eyebrow="Our Values"
        title="Driven by people. Guided by purpose."
      >
        <p>
          FYHT4 exists to prove that communities can solve their own problems when given the chance. We combine transparency, local input, and collective action to turn ideas into impact—without bureaucracy getting in the way.
        </p>
      </SectionIntro>

      <Container className="mt-24">
        <GridList>
          <GridListItem title="Community-Led">
            We believe the people closest to the issue are also closest to the solution. Every project starts with your voice.
          </GridListItem>
          <GridListItem title="Transparent">
            From voting to budgeting, every step is visible to contributors and residents alike—because trust is built through clarity.
          </GridListItem>
          <GridListItem title="Action-Oriented">
            Once a project is approved, we get to work. No red tape. Just real change powered by real people.
          </GridListItem>
          <GridListItem title="Equitable">
            Every zip code matters. Every vote counts. We build with, not for, the communities we serve.
          </GridListItem>
          <GridListItem title="Accountable">
            We track impact and invite communities to assess outcomes—not just once, but continuously.
          </GridListItem>
          <GridListItem title="Sustainable">
            Our work doesn’t stop at delivery. We empower communities to maintain and evolve the projects they helped create.
          </GridListItem>
        </GridList>
      </Container>
    </div>
  );
}


export const metadata: Metadata = {
  title: 'Our Process',
  description:
    'We believe in efficiency and maximizing our resources to provide the best value to our clients.',
}

export default function Process() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Our process" title="How it works">
        <p>
          FYHT4 empowers people to contribute in the areas of education, health and well-being, or housing. Every contributor receives a vote on projects in their selected category and location, and once a majority of relevant zip codes approve, the project moves forward—no bureaucracy, just action.
        </p>
      </PageIntro>

      <div className="mt-24 space-y-24 [counter-reset:section] sm:mt-32 sm:space-y-32 lg:mt-40 lg:space-y-40">
        <Discover />
        <Build />
        <Deliver />
      </div>

      <Values />

      <ContactSection />
    </RootLayout>
  )
}
