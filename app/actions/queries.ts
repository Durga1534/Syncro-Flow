"use server"

import { auth } from "@clerk/nextjs/server"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/app/lib/db"
import { activities, members, tasks, workspaces } from "@/app/lib/db/schema"
import type { WorkspacePageData } from "@/app/lib/types"

async function requireMembership(workspaceId: string, userId: string) {
    return db.query.members.findFirst({
        where: and(
            eq(members.userId, userId),
            eq(members.workspaceId, workspaceId)
        ),
    })
}

export async function getWorkspacePageData(
    workspaceId: string
): Promise<
    | { success: true; data: WorkspacePageData }
    | { success: false; error: string }
> {
    const { userId } = await auth()

    if (!userId) {
        return { success: false, error: "Unauthorized" }
    }

    const membership = await requireMembership(workspaceId, userId)

    if (!membership) {
        return { success: false, error: "You are not a member of this workspace" }
    }

    const workspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.id, workspaceId),
    })

    if (!workspace) {
        return { success: false, error: "Workspace not found" }
    }

    const [taskList, memberList, activityList] = await Promise.all([
        db.query.tasks.findMany({
            where: eq(tasks.workspaceId, workspaceId),
            with: { assignee: true },
            orderBy: desc(tasks.updatedAt),
        }),
        db.query.members.findMany({
            where: eq(members.workspaceId, workspaceId),
            with: { user: true },
        }),
        db.query.activities.findMany({
            where: eq(activities.workspaceId, workspaceId),
            with: { user: true },
            orderBy: desc(activities.createdAt),
            limit: 30,
        }),
    ])

    return {
        success: true,
        data: {
            workspace,
            tasks: taskList,
            members: memberList,
            activities: activityList,
            currentUserRole: membership.role ?? "member",
            currentUserId: userId,
        },
    }
}

export async function getUserWorkspaces() {
    const { userId } = await auth()

    if (!userId) {
        return { success: false as const, error: "Unauthorized", data: [] }
    }

    const memberships = await db.query.members.findMany({
        where: eq(members.userId, userId),
        with: { workspace: true },
    })

    return {
        success: true as const,
        error: null,
        data: memberships.map((m) => m.workspace),
    }
}
