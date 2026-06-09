import type { activities, members, tasks, users, workspaces } from "@/app/lib/db/schema"

export type TaskStatus = "todo" | "in_progress" | "done" | "blocked"
export type TaskPriority = "low" | "medium" | "high"
export type MemberRole = "owner" | "admin" | "member"

export type UserSummary = Pick<typeof users.$inferSelect, "id" | "name" | "email" | "avatar">

export type TaskWithRelations = typeof tasks.$inferSelect & {
    assignee: UserSummary | null
}

export type MemberWithUser = typeof members.$inferSelect & {
    user: UserSummary
}

export type ActivityWithUser = typeof activities.$inferSelect & {
    user: UserSummary
}

export type WorkspaceData = typeof workspaces.$inferSelect

export type WorkspacePageData = {
    workspace: WorkspaceData
    tasks: TaskWithRelations[]
    members: MemberWithUser[]
    activities: ActivityWithUser[]
    currentUserRole: MemberRole
    currentUserId: string
}

export type TaskCreatedEvent = {
    taskId: string
    title: string
    description?: string | null
    priority: TaskPriority
    assigneeId?: string | null
    workspaceId: string
    createdBy: string
}

export type TaskStatusUpdatedEvent = {
    taskId: string
    status: TaskStatus
    updatedBy: string
}

export type TaskAssignedEvent = {
    taskId: string
    assigneeId?: string | null
    updatedBy: string
}
