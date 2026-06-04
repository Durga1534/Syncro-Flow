'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

export default function WorkspacePage() {
  const params = useParams()
  const workspaceId = params.id as string

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Welcome to your Workspace</h1>
        <p className="text-muted-foreground mt-2">Workspace ID: <code className="bg-muted px-2 py-1 rounded text-sm">{workspaceId}</code></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1</div>
            <p className="text-xs text-muted-foreground mt-1">You are the owner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Create your first task</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your workspace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full gap-2" size="lg">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
          <Button variant="outline" className="w-full gap-2" size="lg">
            <Users className="h-4 w-4" />
            Invite Members
          </Button>
        </CardContent>
      </Card>

      {/* Workspace Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Workspace ID</p>
            <p className="text-foreground mt-1 font-mono text-sm break-all">{workspaceId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <p className="text-foreground mt-1 font-semibold">Owner</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-foreground mt-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Active
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}