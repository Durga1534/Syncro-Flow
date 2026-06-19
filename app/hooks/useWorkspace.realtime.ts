"use client"

import { useEffect, useRef } from "react"
import { getPusherClient } from "@/app/lib/pusher/client"
import type {
    TaskAssignedEvent,
    TaskCreatedEvent,
    TaskDeletedEvent,
    TaskStatusUpdatedEvent,
    TaskUpdatedEvent,
} from "@/app/lib/types"

type RealtimeHandlers = {
    onTaskCreated: (data: TaskCreatedEvent) => void
    onTaskStatusUpdated: (data: TaskStatusUpdatedEvent) => void
    onTaskAssigned: (data: TaskAssignedEvent) => void
    onTaskUpdated: (data: TaskUpdatedEvent) => void
    onTaskDeleted: (data: TaskDeletedEvent) => void
    onDisconnected?: () => void
    onConnected?: () => void
}

export function useWorkspaceRealtime(
    workspaceId: string,
    handlers: RealtimeHandlers
) {
    const handlersRef = useRef(handlers)

    useEffect(() => {
        handlersRef.current = handlers
    }, [handlers])

    useEffect(() => {
        const pusherClient = getPusherClient()
        const channel = pusherClient.subscribe(`workspace-${workspaceId}`)

        const onCreated = (data: TaskCreatedEvent) =>
            handlersRef.current.onTaskCreated(data)
        const onStatus = (data: TaskStatusUpdatedEvent) =>
            handlersRef.current.onTaskStatusUpdated(data)
        const onAssigned = (data: TaskAssignedEvent) =>
            handlersRef.current.onTaskAssigned(data)
        const onUpdated = (data: TaskUpdatedEvent) =>
            handlersRef.current.onTaskUpdated(data)
        const onDeleted = (data: TaskDeletedEvent) =>
            handlersRef.current.onTaskDeleted(data)

        channel.bind("task-created", onCreated)
        channel.bind("task-status-updated", onStatus)
        channel.bind("task-assigned", onAssigned)
        channel.bind("task-updated", onUpdated)
        channel.bind("task-deleted", onDeleted)

        const onStateChange = (states: { current: string }) => {
            if (states.current === "connected") {
                handlersRef.current.onConnected?.()
            } else if (
                states.current === "disconnected" ||
                states.current === "unavailable"
            ) {
                handlersRef.current.onDisconnected?.()
            }
        }

        pusherClient.connection.bind("state_change", onStateChange)

        return () => {
            channel.unbind("task-created", onCreated)
            channel.unbind("task-status-updated", onStatus)
            channel.unbind("task-assigned", onAssigned)
            channel.unbind("task-updated", onUpdated)
            channel.unbind("task-deleted", onDeleted)
            pusherClient.connection.unbind("state_change", onStateChange)
            pusherClient.unsubscribe(`workspace-${workspaceId}`)
        }
    }, [workspaceId])
}
