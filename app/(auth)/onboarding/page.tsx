'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { createWorkspace, checkUserWorkspaces } from '@/app/actions/onboarding'

export default function OnboardingPage() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()
  
  const [workspaceName, setWorkspaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  // Check if user already has workspace on mount
  useEffect(() => {
    const checkWorkspace = async () => {
      if (!isLoaded || !userId) return
      
      try {
        const result = await checkUserWorkspaces()
        if (result.success && result.data && result.data.length > 0) {
          // User already has workspace, redirect to dashboard
          const firstWorkspace = result.data[0]
          if (firstWorkspace?.id) {
            router.push(`/dashboard/workspace/${firstWorkspace.id}`)
          }
        }
      } catch (err) {
        console.error('Error checking workspaces:', err)
      } finally {
        setChecking(false)
      }
    }

    checkWorkspace()
  }, [isLoaded, userId, router])

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!workspaceName.trim()) {
      setError('Workspace name is required')
      return
    }

    if (workspaceName.length < 3) {
      setError('Workspace name must be at least 3 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await createWorkspace({ name: workspaceName })
      
      if (result.success) {
        router.push(`/dashboard/workspace/${result.data.id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to create workspace. Please try again.')
      console.error('Error creating workspace:', err)
    } finally {
      setLoading(false)
    }
  }

  if (checking || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Welcome!</h1>
        <p className="text-gray-600 mb-6">Create your first workspace to get started</p>

        <form onSubmit={handleCreateWorkspace}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              placeholder="e.g., My Project"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Min 3 characters</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !workspaceName.trim()}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          You&apos;ll be the owner of this workspace
        </p>
      </div>
    </div>
  )
}