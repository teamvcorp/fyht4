// Enhanced voting component with better UX and membership handling
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface VotingSystemProps {
  projectId: string
  projectStatus: string
  projectZipcode: string
  initialVotesYes: number
  initialVotesNo: number
  voteGoal: number
  userZipcode?: string | null
  hasActiveSubscription?: boolean
  className?: string
}

interface UserVote {
  projectId: string
  value: 'yes' | 'no'
  createdAt: string
}

export function VotingSystem({
  projectId,
  projectStatus,
  projectZipcode,
  initialVotesYes,
  initialVotesNo,
  voteGoal,
  userZipcode,
  hasActiveSubscription,
  className = ''
}: VotingSystemProps) {
  const { data: session, status } = useSession()
  const [votesYes, setVotesYes] = useState(initialVotesYes)
  const [votesNo, setVotesNo] = useState(initialVotesNo)
  const [userVote, setUserVote] = useState<'yes' | 'no' | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [message, setMessage] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Check if user can vote
  const canVote = session && 
    hasActiveSubscription && 
    userZipcode === projectZipcode && 
    projectStatus === 'voting' &&
    !userVote

  // Load user's existing vote
  useEffect(() => {
    const fetchUserVote = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/user-vote`)
        if (response.ok) {
          const data = await response.json()
          if (data.vote) {
            setUserVote(data.vote.value)
          }
        }
      } catch (error) {
        // User hasn't voted yet
      }
    }

    if (session?.user?.id) {
      fetchUserVote()
    }
  }, [session?.user?.id, projectId])

  const handleVote = async (value: 'yes' | 'no', event?: React.MouseEvent) => {
    // Prevent event bubbling and default behavior
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }

    if (!session) {
      setShowLoginPrompt(true)
      return
    }

    if (!hasActiveSubscription) {
      setMessage('Monthly membership required to vote')
      return
    }

    if (userZipcode !== projectZipcode) {
      setMessage(`You must live in ZIP ${projectZipcode} to vote on this project`)
      return
    }

    if (projectStatus !== 'voting') {
      setMessage('Voting is not open for this project')
      return
    }

    setIsVoting(true)
    setMessage('')

    try {
      const response = await fetch(`/api/projects/${projectId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to vote')
      }

      // Update vote counts
      setVotesYes(data.votesYes)
      setVotesNo(data.votesNo)
      setUserVote(value)
      setMessage(`Vote recorded! Thank you for participating.`)

      // Trigger achievement system refresh by dispatching a custom event
      window.dispatchEvent(new CustomEvent('achievementUpdate', { 
        detail: { type: 'vote', projectId } 
      }))

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000)

    } catch (error: any) {
      setMessage(error.message || 'Failed to vote')
    } finally {
      setIsVoting(false)
    }
  }

  const getVoteProgress = () => {
    return voteGoal > 0 ? Math.min((votesYes / voteGoal) * 100, 100) : 0
  }

  if (projectStatus !== 'voting') {
    return (
      <div className={`text-sm text-neutral-500 ${className}`}>
        {projectStatus === 'funding' && 'Voting complete - Now funding'}
        {projectStatus === 'active' && 'Project is active'}
        {projectStatus === 'completed' && 'Project completed'}
        {projectStatus === 'draft' && 'Project in review'}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Vote Buttons */}
      <div className="flex items-center gap-2">
        {userVote ? (
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl text-sm font-medium ${
              userVote === 'yes' 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-neutral-100 text-neutral-700'
            }`}>
              You voted {userVote === 'yes' ? '👍 Yes' : '👎 No'}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleVote('yes', e)}
              disabled={!canVote || isVoting}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition ${
                canVote 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isVoting ? 'Voting...' : '👍 Vote Yes'}
            </button>
            <button
              onClick={(e) => handleVote('no', e)}
              disabled={!canVote || isVoting}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition border ${
                canVote 
                  ? 'border-neutral-300 text-neutral-700 hover:border-neutral-500' 
                  : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isVoting ? 'Voting...' : '👎 Vote No'}
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">
            {votesYes} Yes • {votesNo} No
          </span>
          <span className="text-neutral-600">
            {votesYes}/{voteGoal} needed
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getVoteProgress()}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`text-sm p-2 rounded-lg ${
          message.includes('Thank you') || message.includes('recorded')
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {message}
        </div>
      )}

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="text-sm bg-blue-50 text-blue-700 p-2 rounded-lg">
          <a href="/membership" className="underline hover:text-blue-800">
            Sign in to vote on community projects
          </a>
        </div>
      )}

      {/* Voting Requirements */}
      {!userVote && status === 'authenticated' && (
        <div className="text-xs text-neutral-500 space-y-1">
          {!hasActiveSubscription && (
            <div className="flex items-center gap-1">
              <span className="text-amber-500">⚠️</span>
              <span>Monthly membership required to vote</span>
              <a href="/membership" className="text-blue-600 underline ml-1">Upgrade</a>
            </div>
          )}
          {hasActiveSubscription && userZipcode !== projectZipcode && (
            <div className="flex items-center gap-1">
              <span className="text-amber-500">⚠️</span>
              <span>You must live in ZIP {projectZipcode} to vote</span>
            </div>
          )}
          {hasActiveSubscription && userZipcode === projectZipcode && (
            <div className="flex items-center gap-1">
              <span className="text-emerald-500">✓</span>
              <span>You can vote on this project</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}