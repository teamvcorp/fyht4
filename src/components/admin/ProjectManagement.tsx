// src/components/admin/ProjectManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface ProjectData {
  id: string
  title: string
  slug?: string
  status: 'draft' | 'voting' | 'funding' | 'build' | 'completed'
  zipcode: string
  city?: string
  state?: string
  category?: string
  shortDescription?: string
  description?: string
  voteGoal: number
  votesYes?: number
  votesNo?: number
  fundingGoal: number
  totalRaised?: number
  votePct: number
  fundPct: number
  createdAt: string
  buildStartedAt?: string
  completedAt?: string
  createdBy?: {
    name?: string
    email?: string
  }
}

interface EditModalProps {
  project: ProjectData | null
  isOpen: boolean
  onClose: () => void
  onSave: (projectId: string, updates: any) => Promise<void>
}

function EditModal({ project, isOpen, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    status: 'draft' as ProjectData['status'],
    voteGoal: 0,
    fundingGoal: 0,
    category: '',
    zipcode: '',
    city: '',
    state: '',
    shortDescription: '',
    description: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        status: project.status,
        voteGoal: project.voteGoal || 0,
        fundingGoal: project.fundingGoal || 0,
        category: project.category || '',
        zipcode: project.zipcode || '',
        city: project.city || '',
        state: project.state || '',
        shortDescription: project.shortDescription || '',
        description: project.description || ''
      })
    }
  }, [project])

  if (!isOpen || !project) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await onSave(project.id, formData)
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Project: {project.title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Short Description</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Brief summary for cards and previews"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Full Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Detailed project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectData['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="draft">Draft</option>
                <option value="voting">Voting</option>
                <option value="funding">Funding</option>
                <option value="build">Build</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vote Goal</label>
              <input
                type="number"
                value={formData.voteGoal}
                onChange={(e) => setFormData({ ...formData, voteGoal: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Funding Goal ($)</label>
              <input
                type="number"
                value={formData.fundingGoal}
                onChange={(e) => setFormData({ ...formData, fundingGoal: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Zipcode</label>
              <input
                type="text"
                value={formData.zipcode}
                onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    voting: 'bg-blue-100 text-blue-800',
    funding: 'bg-yellow-100 text-yellow-800',
    build: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800'
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/projects')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects')
      }

      setProjects(data.projects || [])
    } catch (err: any) {
      console.error('Error fetching projects:', err)
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (project: ProjectData) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const handleSave = async (projectId: string, updates: any) => {
    try {
      const response = await fetch('/api/admin/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectId, updates })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project')
      }

      // Refresh projects list
      await fetchProjects()
    } catch (err: any) {
      console.error('Error updating project:', err)
      throw err
    }
  }

  const handleDelete = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/projects?projectId=${projectId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project')
      }

      // Refresh projects list
      await fetchProjects()
    } catch (err: any) {
      console.error('Error deleting project:', err)
      alert(`Failed to delete project: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchProjects}>
            Retry
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Project Management
        </h1>
        <p className="mt-6 text-xl leading-8 text-gray-600">
          View and manage all projects sorted by zipcode. Click edit to modify project details or delete inappropriate projects.
        </p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">{projects.length} projects total</p>
        <Button onClick={fetchProjects}>
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{project.title}</div>
                    <div className="text-sm text-gray-500">{project.category}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{project.zipcode}</div>
                  <div className="text-sm text-gray-500">{project.city}, {project.state}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="mb-1">
                    Votes: {project.votesYes}/{project.voteGoal} ({project.votePct}%)
                  </div>
                  <div>
                    Funding: ${(project.totalRaised || 0).toLocaleString()}/${project.fundingGoal.toLocaleString()} ({project.fundPct}%)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {project.createdBy ? (
                    <div>
                      <div className="text-sm text-gray-900">{project.createdBy.name}</div>
                      <div className="text-sm text-gray-500">{project.createdBy.email}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Unknown</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.title)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found.</p>
        </div>
      )}

      <EditModal
        project={editingProject}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingProject(null)
        }}
        onSave={handleSave}
      />
    </Container>
  )
}