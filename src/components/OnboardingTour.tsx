'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/FadeIn'
import { Button } from '@/components/Button'

interface OnboardingStep {
  id: string
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  highlight?: string // CSS selector to highlight
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FYHT4! 🎉',
    description: 'You\'re now part of a community that turns ideas into action. Let\'s show you how it works.',
  },
  {
    id: 'projects',
    title: 'Discover Local Projects',
    description: 'Browse projects in your area. See what your neighbors are working on and how you can help.',
    action: { label: 'Explore Projects', href: '/projects' }
  },
  {
    id: 'voting',
    title: 'Your Voice Matters',
    description: 'Vote on projects in your ZIP code. Only local residents can vote - your community decides what gets built.',
  },
  {
    id: 'propose',
    title: 'Submit Your Ideas',
    description: 'Got an idea for your community? Submit a proposal. If approved, it goes to community vote.',
    action: { label: 'Submit Proposal', href: '/projects/submit' }
  },
  {
    id: 'impact',
    title: 'Track Real Impact',
    description: 'Follow projects from idea to completion. Get updates and see the tangible results of community action.',
  },
  {
    id: 'dashboard',
    title: 'Your Personal Hub',
    description: 'Track your donated projects, proposals, and local activity all in one place.',
    action: { label: 'Go to Dashboard', href: '/dashboard' }
  }
]

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('fyht4_onboarding_completed')
    if (!completed) {
      setIsVisible(true)
    }
  }, [])

  const currentStepData = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('fyht4_onboarding_completed', 'true')
    setIsVisible(false)
  }

  const handleSkip = () => {
    localStorage.setItem('fyht4_onboarding_completed', 'true')
    setIsVisible(false)
  }

  const handleAction = () => {
    if (currentStepData.action) {
      router.push(currentStepData.action.href)
      handleComplete()
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <FadeIn>
        <div className="mx-4 max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-emerald-600' : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </p>
          </div>

          {/* Content */}
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-neutral-900">
              {currentStepData.title}
            </h2>
            <p className="mt-4 text-neutral-600">
              {currentStepData.description}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            {currentStepData.action && (
              <Button
                onClick={handleAction}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700"
              >
                {currentStepData.action.label}
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              variant={currentStepData.action ? 'secondary' : 'primary'}
              className="w-full justify-center"
            >
              {isLastStep ? 'Get Started!' : 'Next'}
            </Button>

            <button
              onClick={handleSkip}
              className="text-sm text-neutral-500 hover:text-neutral-700 transition"
            >
              Skip tour
            </button>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

// Hook to restart onboarding (for testing/admin)
export function useOnboardingReset() {
  return () => {
    localStorage.removeItem('fyht4_onboarding_completed')
    window.location.reload()
  }
}