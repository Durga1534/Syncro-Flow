"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react"
import { useWorkspaceRealtime } from "@/app/hooks/useWorkspace.realtime"
import { getWorkspacePageData } from "@/app/actions/queries"
import type {
    ActivityWithUser,
    MemberWithUser,
    TaskAssignedEvent,
    TaskCreatedEvent,
    TaskStatusUpdatedEvent,
    TaskWithRelations,
    WorkspacePageData,
} from "@/app/lib/types"

type WorkspaceContextValue = WorkspacePageData & {
    tasks: TaskWithRelations[]
    members: MemberWithUser[]
    activities: ActivityWithUser[]
    isConnected: boolean
    setTasks: React.Dispatch<React.SetStateAction<TaskWithRelations[]>>
    setActivities: React.Dispatch<React.SetStateAction<ActivityWithUser[]>>
    refresh: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace() {
    const ctx = useContext(WorkspaceContext)
    if (!ctx) {
        throw new Error("useWorkspace must be used within WorkspaceProvider")
    }
    return ctx
}

function buildActivity(
    workspaceId: string,
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown>,
    user: ActivityWithUser["user"]
): ActivityWithUser {
    return {
        id: crypto.randomUUID(),
        workspaceId,
        userId,
        action,
        entityType,
        entityId,
        metadata,
        createdAt: new Date(),
        user,
    }
}

export function WorkspaceProvider({
    workspaceId,
    initial,
    children,
}: {
    workspaceId: string
    initial: WorkspacePageData
    children: ReactNode
}) {
    const [tasks, setTasks] = useState(initial.tasks)
    const [members, setMembers] = useState(initial.members)
    const [activities, setActivities] = useState(initial.activities)
    const [isConnected, setIsConnected] = useState(true)
    const membersRef = useRef(members)

    useEffect(() => {
        membersRef.current = members
    }, [members])

    const refresh = useCallback(async () => {
        const result = await getWorkspacePageData(workspaceId)
        if (result.success) {
            setTasks(result.data.tasks)
            setMembers(result.data.members)
            setActivities(result.data.activities)
        }
    }, [workspaceId])

    const findUser = useCallback(
        (userId: string) =>
            membersRef.current.find((m) => m.userId === userId)?.user ?? {
                id: userId,
                name: "Unknown",
                email: "",
                avatar: null,
            },
        []
    )

    const onTaskCreated = useCallback(
        (data: TaskCreatedEvent) => {
            setTasks((prev) => {
                if (prev.some((t) => t.id === data.taskId)) return prev
                const assignee = data.assigneeId
                    ? membersRef.current.find((m) => m.userId === data.assigneeId)
                          ?.user ?? null
                    : null
                return [
                    {
                        id: data.taskId,
                        workspaceId: data.workspaceId,
                        title: data.title,
                        description: data.description ?? null,
                        status: "todo",
                        priority: data.priority,
                        assigneeId: data.assigneeId ?? null,
                        createdBy: data.createdBy,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        assignee,
                    },
                    ...prev,
                ]
            })
            setActivities((prev) => [
                buildActivity(
                    workspaceId,
                    data.createdBy,
                    "created_task",
                    "task",
                    data.taskId,
                    { title: data.title },
                    findUser(data.createdBy)
                ),
                ...prev,
            ])
        },
        [workspaceId, findUser]
    )

    const onTaskStatusUpdated = useCallback(
        (data: TaskStatusUpdatedEvent) => {
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === data.taskId
                        ? { ...t, status: data.status, updatedAt: new Date() }
                        : t
                )
            )
            setActivities((prev) => [
                buildActivity(
                    workspaceId,
                    data.updatedBy,
                    "updated_task_status",
                    "task",
                    data.taskId,
                    { status: data.status },
                    findUser(data.updatedBy)
                ),
                ...prev,
            ])
        },
        [workspaceId, findUser]
    )

    const onTaskAssigned = useCallback(
        (data: TaskAssignedEvent) => {
            setTasks((prev) =>
                prev.map((t) => {
                    if (t.id !== data.taskId) return t
                    const assignee = data.assigneeId
                        ? membersRef.current.find(
                              (m) => m.userId === data.assigneeId
                          )?.user ?? null
                        : null
                    return {
                        ...t,
                        assigneeId: data.assigneeId ?? null,
                        assignee,
                        updatedAt: new Date(),
                    }
                })
            )
            setActivities((prev) => [
                buildActivity(
                    workspaceId,
                    data.updatedBy,
                    "assigned_task",
                    "task",
                    data.taskId,
                    { assigneeId: data.assigneeId },
                    findUser(data.updatedBy)
                ),
                ...prev,
            ])
        },
        [workspaceId, findUser]
    )

    useWorkspaceRealtime(workspaceId, {
        onTaskCreated,
        onTaskStatusUpdated,
        onTaskAssigned,
        onConnected: () => setIsConnected(true),
        onDisconnected: () => setIsConnected(false),
    })

    useEffect(() => {
        if (isConnected) return
        const interval = setInterval(refresh, 5000)
        return () => clearInterval(interval)
    }, [isConnected, refresh])

    const value = useMemo(
        () => ({
            ...initial,
            tasks,
            members,
            activities,
            isConnected,
            setTasks,
            setActivities,
            refresh,
        }),
        [initial, tasks, members, activities, isConnected, refresh]
    )

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    )
}
