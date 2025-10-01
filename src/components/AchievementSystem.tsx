'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress?: {
    current: number
    target: number
  }
  type: 'voting' | 'funding' | 'proposing' | 'engagement' | 'community'
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    id: 'first_vote',
    title: 'Democracy in Action',
    description: 'Cast your first vote',
    icon: '🗳️',
    type: 'voting'
  },
  {
    id: 'local_voter',
    title: 'Local Champion',
    description: 'Vote on 5 projects in your ZIP code',
    icon: '🏘️',
    type: 'voting'
  },
  {
    id: 'first_donation',
    title: 'Community Supporter',
    description: 'Make your first donation',
    icon: '💝',
    type: 'funding'
  },
  {
    id: 'monthly_member',
    title: 'Steady Support',
    description: 'Maintain a monthly membership for 3 months',
    icon: '⭐',
    type: 'funding'
  },
  {
    id: 'first_proposal',
    title: 'Idea Generator',
    description: 'Submit your first project proposal',
    icon: '💡',
    type: 'proposing'
  },
  {
    id: 'approved_proposal',
    title: 'Community Builder',
    description: 'Get a proposal approved and moved to voting',
    icon: '🚀',
    type: 'proposing'
  },
  {
    id: 'funded_project',
    title: 'Change Maker',
    description: 'Help fully fund a project to completion',
    icon: '🎯',
    type: 'funding'
  },
  {
    id: 'early_adopter',
    title: 'Pioneer',
    description: 'One of the first 100 members',
    icon: '🌟',
    type: 'community'
  },
  {
    id: 'active_week',
    title: 'Weekly Warrior',
    description: 'Active 7 days in a row',
    icon: '🔥',
    type: 'engagement'
  }
]

export function AchievementSystem() {
  const { data: session } = useSession()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [newUnlocks, setNewUnlocks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      loadAchievements()
    }
  }, [session])

  // Listen for achievement updates from other components
  useEffect(() => {
    const handleAchievementUpdate = () => {
      if (session?.user) {
        loadAchievements()
      }
    }

    window.addEventListener('achievementUpdate', handleAchievementUpdate)
    return () => window.removeEventListener('achievementUpdate', handleAchievementUpdate)
  }, [session])

  const loadAchievements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/achievements')
      const data = await res.json()
      if (data.success) {
        setAchievements(data.achievements || [])
        // Check for new unlocks
        const previousUnlocks = JSON.parse(localStorage.getItem('fyht4_seen_achievements') || '[]')
        const currentUnlocks = (data.achievements || [])
          .filter((a: Achievement) => a.unlocked)
          .map((a: Achievement) => a.id)
        
        const newOnes = currentUnlocks.filter((id: string) => !previousUnlocks.includes(id))
        if (newOnes.length > 0) {
          setNewUnlocks(newOnes)
          localStorage.setItem('fyht4_seen_achievements', JSON.stringify(currentUnlocks))
        }
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissNewUnlock = (achievementId: string) => {
    setNewUnlocks(prev => prev.filter(id => id !== achievementId))
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

  if (!session?.user) return null

  return (
    <>
      {/* Achievement unlock notifications */}
      {newUnlocks.map(unlockId => {
        const achievement = achievements.find(a => a.id === unlockId)
        if (!achievement) return null

        return (
          <div
            key={unlockId}
            className="fixed top-4 right-4 z-50 max-w-sm bg-emerald-600 text-white p-4 rounded-2xl shadow-lg transform transition-all duration-500"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{achievement.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold">Achievement Unlocked!</h4>
                <p className="text-emerald-100 text-sm">{achievement.title}</p>
              </div>
              <button
                onClick={() => dismissNewUnlock(unlockId)}
                className="text-emerald-200 hover:text-white transition"
              >
                ×
              </button>
            </div>
          </div>
        )
      })}

      {/* Achievement display */}
      <FadeIn>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900 mb-6">
            Your Impact 🏆
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Unlocked achievements */}
              {unlockedAchievements.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-4 uppercase tracking-wider">
                    Unlocked ({unlockedAchievements.length})
                  </h3>
                  <FadeInStagger className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {unlockedAchievements.map(achievement => (
                      <FadeIn key={achievement.id}>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-emerald-900">{achievement.title}</h4>
                            <p className="text-sm text-emerald-700">{achievement.description}</p>
                            {achievement.unlockedAt && (
                              <p className="text-xs text-emerald-600 mt-1">
                                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </FadeInStagger>
                </div>
              )}

              {/* Locked achievements with progress */}
              {lockedAchievements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-4 uppercase tracking-wider">
                    In Progress ({lockedAchievements.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lockedAchievements.slice(0, 6).map(achievement => (
                      <div key={achievement.id} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                        <div className="text-3xl opacity-50">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-neutral-600">{achievement.title}</h4>
                          <p className="text-sm text-neutral-500">{achievement.description}</p>
                          {achievement.progress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-neutral-500 mb-1">
                                <span>{achievement.progress.current} / {achievement.progress.target}</span>
                                <span>{Math.round((achievement.progress.current / achievement.progress.target) * 100)}%</span>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div 
                                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, (achievement.progress.current / achievement.progress.target) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unlockedAchievements.length === 0 && lockedAchievements.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="font-semibold text-neutral-900 mb-2">Start Your Journey</h3>
                  <p className="text-neutral-600">Vote on a project or make a donation to unlock your first achievement!</p>
                </div>
              )}
            </>
          )}
        </div>
      </FadeIn>
    </>
  )
}