"use client"

import { useWorkspace } from "@/app/providers/workspace-provider"
import type { ActivityWithUser } from "@/app/lib/types"
import { Clock, UserPlus, Zap } from "lucide-react"

function formatAction(activity: ActivityWithUser): string {
    const name = activity.user.name || activity.user.email || "Someone"
    const meta = activity.metadata as Record<string, unknown> | null

    switch (activity.action) {
        case "created_workspace":
            return `${name} created the workspace`
        case "created_task":
            return `${name} created task "${meta?.title ?? "Untitled"}"`
        case "updated_task_status":
            return `${name} moved a task to ${meta?.status ?? "updated"}`
        case "assigned_task":
            return `${name} assigned a task`
        case "invited_member":
            return `${name} invited ${meta?.email ?? "a member"}`
        case "removed_member":
            return `${name} removed a member`
        default:
            return `${name} performed ${activity.action}`
    }
}

function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function ActivityIcon({ action }: { action: string }) {
    if (action.includes("member")) {
        return <UserPlus className="h-4 w-4 text-violet-600" />
    }
    if (action.includes("task")) {
        return <Zap className="h-4 w-4 text-blue-600" />
    }
    return <Clock className="h-4 w-4 text-emerald-600" />
}

export function ActivityFeed({ limit }: { limit?: number }) {
    const { activities } = useWorkspace()
    const items = limit ? activities.slice(0, limit) : activities

    if (items.length === 0) {
        return (
            <p className="text-xs text-muted-foreground text-center py-6">
                No activity yet
            </p>
        )
    }

    return (
        <div className="space-y-3">
            {items.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                    <div className="p-1.5 bg-muted rounded-lg shrink-0">
                        <ActivityIcon action={activity.action} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                            {formatAction(activity)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {timeAgo(activity.createdAt)}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
