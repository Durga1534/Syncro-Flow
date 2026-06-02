"use client"

import { useEffect } from "react"
import { pusherClient } from "@/app/lib/pusher/client"

export function useWorkspaceRealtime(
    workspaceId: string,
    onTaskCreated: (data: unknown) => void,
    onTaskStatusUpdated: (data: unknown) => void,
    onTaskAssigned: (data: unknown) => void, 
) {
    useEffect(() => {
        const channel = pusherClient.subscribe(`workspace-${workspaceId}`)
        channel.bind("task-created", onTaskCreated)
        channel.bind("task-status-updated", onTaskStatusUpdated)
        channel.bind("task-assigned", onTaskAssigned)

        return () => {
            channel.unbind("task-created", onTaskCreated)
            channel.unbind("task-status-updated", onTaskStatusUpdated)
            channel.unbind("task-assigned", onTaskAssigned)
            pusherClient.unsubscribe(`workspace-${workspaceId}`)
        } 
    }, [workspaceId, onTaskCreated, onTaskStatusUpdated, onTaskAssigned])
}