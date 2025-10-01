'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { Button } from '@/components/Button'
import { VotingSystem } from '@/components/projects/VotingSystem'
import Link from 'next/link'

interface RecommendedProject {
  _id: string
  title: string
  category: string
  zipcode: string
  shortDescription: string
  status: string
  fundingGoal: number
  totalRaised: number
  votesYes: number
  voteGoal: number
  reason: string // Why this project is recommended
}

export function ProjectRecommendations() {
  const { data: session } = useSession()
  const [recommendations, setRecommendations] = useState<RecommendedProject[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [userZipcode, setUserZipcode] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadRecommendations()
      loadUserData()
    }
  }, [session])

  const loadUserData = async () => {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) {
        console.error('Profile API error:', res.status, res.statusText)
        return
      }
      
      const text = await res.text()
      if (!text) {
        console.error('Empty response from profile API')
        return
      }
      
      const data = JSON.parse(text)
      if (data.user) {
        setUserZipcode(data.user.zipcode || null)
        setHasActiveSubscription(data.user.hasActiveSubscription || false)
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects/recommendations')
      if (!res.ok) {
        console.error('Recommendations API error:', res.status, res.statusText)
        return
      }
      
      const text = await res.text()
      if (!text) {
        console.error('Empty response from recommendations API')
        return
      }
      
      const data = JSON.parse(text)
      if (data.success) {
        setRecommendations(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissProject = (projectId: string) => {
    setDismissed(prev => [...prev, projectId])
    // Optionally send to API to remember dismissal
    fetch('/api/projects/recommendations/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    }).catch(console.error)
  }

  const visibleRecommendations = recommendations.filter(p => !dismissed.includes(p._id))

  if (!session?.user || loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
          <div className="h-3 bg-neutral-200 rounded w-full"></div>
          <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (visibleRecommendations.length === 0) {
    return null
  }

  return (
    <FadeIn>
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-emerald-900">
              Recommended for You 🎯
            </h2>
            <p className="mt-1 text-emerald-700 text-sm">
              Projects we think you'll love based on your activity and location
            </p>
          </div>
        </div>

        <FadeInStagger className="space-y-4">
          {visibleRecommendations.slice(0, 3).map((project) => (
            <FadeIn key={project._id}>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 mb-2">
                      <span className="bg-emerald-100 px-2 py-1 rounded-full">
                        {project.category}
                      </span>
                      <span>ZIP {project.zipcode}</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {project.reason}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-neutral-900 mb-2">
                      <Link 
                        href={`/projects/${project._id}`}
                        className="hover:text-emerald-600 transition"
                      >
                        {project.title}
                      </Link>
                    </h3>
                    
                    {project.shortDescription && (
                      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                        {project.shortDescription}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      {project.status === 'voting' && (
                        <span>🗳️ {project.votesYes}/{project.voteGoal} votes</span>
                      )}
                      {project.status === 'funding' && (
                        <span>💰 ${Math.round(project.totalRaised/100).toLocaleString()} / ${Math.round(project.fundingGoal/100).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => dismissProject(project._id)}
                    className="ml-3 text-neutral-400 hover:text-neutral-600 transition"
                    title="Dismiss recommendation"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    href={`/projects/${project._id}`}
                    className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    View Project
                  </Button>
                </div>
                
                {project.status === 'voting' && (
                  <div className="mt-3">
                    <VotingSystem
                      projectId={project._id}
                      projectStatus={project.status}
                      projectZipcode={project.zipcode}
                      initialVotesYes={project.votesYes}
                      initialVotesNo={0} // We don't have votesNo in recommendations
                      voteGoal={project.voteGoal}
                      userZipcode={userZipcode}
                      hasActiveSubscription={hasActiveSubscription}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </FadeInStagger>

        {visibleRecommendations.length > 3 && (
          <div className="mt-6 text-center">
            <Button
              href="/projects"
              variant="secondary"
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-100"
            >
              See All Recommendations
            </Button>
          </div>
        )}
      </div>
    </FadeIn>
  )
}