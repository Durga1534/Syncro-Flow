"use server"

import { createAction } from "@/app/lib/safe.actions"
import z from "zod"
import { db } from "@/app/lib/db"
import { workspaces, members, activities} from "@/app/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

// Schema for creating workspace
const createWorkspaceSchema = z.object({
    name: z.string().min(3, "Workspace name must be atleast 3 characters").max(50, "Workspace name must be less than 50 characters"),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>

// Server action to create workspace
export const createWorkspace = createAction(
    createWorkspaceSchema,
    async (data, userId) => {
        const { name } = data;

        const exisitingWorkspace = await db.query.workspaces.findFirst({
            where: eq(workspaces.ownerId, userId),
        })
        if (exisitingWorkspace) {
            throw new Error("You already have a workspace")
        }

        // Create workspace
        const newWorkspace = await db.insert(workspaces).values({
            name,
            ownerId: userId,
        }).returning({
            id: workspaces.id,
            name: workspaces.name,
            ownerId: workspaces.ownerId,
            createdAt: workspaces.createdAt,
        })

        if(!newWorkspace[0]) {
            throw new Error("Failed to create workspace")
        }

        // Add user as owner in members table
        await db.insert(members).values({
            userId: userId,
            workspaceId: newWorkspace[0].id,
            role: "owner",
        })

        // Log activity
        await db.insert(activities).values({
            workspaceId: newWorkspace[0].id,
            userId: userId,
            action: "created_workspace",
            entityType: "workspace",
            entityId: newWorkspace[0].id,
            metadata: {},
        })
        return newWorkspace[0]
    }
)

// Server action to check user's workspaces
export async function checkUserWorkspaces() {
    try {
        const { userId } = await auth()

        if(!userId) {
            return {
                success: false,
                error: 'Unauthorized',
                data: null,
            }
        }

        const userWorkspaces = await db.query.workspaces.findMany({
            where: eq(workspaces.ownerId, userId),
        })

        return {
            success: true,
            error: null,
            data: userWorkspaces,
        }
    }catch(err) {
        return {
            success: false,
            error: "Failed to check workspaces",
            data: null,
        }
    }
}