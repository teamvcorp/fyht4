'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ProjectNotification {
  id: string
  title: string
  location: string
}

interface ReadyForBuild extends ProjectNotification {
  status: string
  voteProgress: string
  fundingProgress: string
  votesMet: boolean
  fundingMet: boolean
}

interface ReadyForCompletion extends ProjectNotification {
  buildStartedAt: string
  daysSinceStart: number
}

interface NotificationData {
  readyForBuild: ReadyForBuild[]
  readyForCompletion: ReadyForCompletion[]
}

export function AdminNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<NotificationData>({
    readyForBuild: [],
    readyForCompletion: []
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchNotifications()
    }
  }, [isAdmin])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (projectId: string, action: string) => {
    setActionLoading(projectId)
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action })
      })

      if (response.ok) {
        await fetchNotifications() // Refresh the list
        const result = await response.json()
        alert(result.message)
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      alert('Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Admin Notifications
        </h3>
        <div className="text-sm text-neutral-600">Loading...</div>
      </div>
    )
  }

  const hasNotifications = notifications.readyForBuild.length > 0 || notifications.readyForCompletion.length > 0

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Admin Notifications
      </h3>

      {!hasNotifications ? (
        <div className="text-sm text-neutral-600">
          No pending notifications
        </div>
      ) : (
        <div className="space-y-6">
          {/* Projects Ready for Building */}
          {notifications.readyForBuild.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-neutral-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Ready for Building ({notifications.readyForBuild.length})
              </h4>
              <div className="space-y-3">
                {notifications.readyForBuild.map(project => (
                  <div key={project.id} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-neutral-900">{project.title}</h5>
                        <p className="text-sm text-neutral-600">{project.location}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full">
                        {project.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-neutral-600">Votes: </span>
                        <span className={`font-medium ${project.votesMet ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {project.voteProgress} {project.votesMet ? '✓' : '⏳'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-600">Funding: </span>
                        <span className={`font-medium ${project.fundingMet ? 'text-emerald-600' : 'text-orange-600'}`}>
                          {project.fundingProgress} {project.fundingMet ? '✓' : '⏳'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(project.id, 'moveToBuilding')}
                        disabled={actionLoading === project.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading === project.id ? 'Processing...' : 'Move to Building'}
                      </button>
                      <button
                        onClick={() => handleAction(project.id, 'markBuildNotified')}
                        disabled={actionLoading === project.id}
                        className="px-3 py-1.5 bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-300 disabled:opacity-50"
                      >
                        Mark Notified
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Ready for Completion */}
          {notifications.readyForCompletion.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-neutral-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Ready for Completion Review ({notifications.readyForCompletion.length})
              </h4>
              <div className="space-y-3">
                {notifications.readyForCompletion.map(project => (
                  <div key={project.id} className="border border-neutral-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium text-neutral-900">{project.title}</h5>
                        <p className="text-sm text-neutral-600">{project.location}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        Building
                      </span>
                    </div>
                    
                    <div className="mb-3 text-sm">
                      <span className="text-neutral-600">Build started: </span>
                      <span className="font-medium">
                        {new Date(project.buildStartedAt).toLocaleDateString()} 
                        ({project.daysSinceStart} days ago)
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(project.id, 'markCompleted')}
                        disabled={actionLoading === project.id}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {actionLoading === project.id ? 'Processing...' : 'Mark Completed'}
                      </button>
                      <button
                        onClick={() => handleAction(project.id, 'markCompletionNotified')}
                        disabled={actionLoading === project.id}
                        className="px-3 py-1.5 bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-300 disabled:opacity-50"
                      >
                        Mark Notified
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={fetchNotifications}
        className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 underline"
      >
        Refresh Notifications
      </button>
    </div>
  )
}