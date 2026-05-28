"use server"

import { createAction } from "@/app/lib/safe.actions"
import { createWorkspaceSchema, inviteMemberSchema, removeMemberSchema } from "@/app/lib/validations/workspace"
import { db } from "@/app/lib/db"
import { workspaces, members, users, activities } from "@/app/lib/db/schema"
import { eq, and } from "drizzle-orm"

export const createWorkspace = createAction(
    createWorkspaceSchema,
    async (data, userId) => {
        const { name } = data;

        const workspace = await db.insert(workspaces).values({
            name,
            ownerId: userId,

        }).returning({
            id: workspaces.id,
            name: workspaces.name,
            ownerId: workspaces.ownerId,
            createdAt: workspaces.createdAt,
        });

        if (!workspace[0]) {
            throw new Error("Failed to create a workspace")
        }
        await db.insert(members).values({
            userId: userId,
            workspaceId: workspace[0].id,
            role: "owner",
        })
        return workspace[0];
    }
);

export const inviteMember = createAction(
    inviteMemberSchema,
    async (data, userId) => {
        const {email, role, workspaceId} = data;
        const workspace = await db.query.workspaces.findFirst({
            where: eq(workspaces.id, workspaceId),
        })

        if(!workspace) {
            throw new Error("Workspace not found")
        }
        if(workspace.ownerId !== userId) {
            throw new Error("Only the owner can invite members")
        }
        const invitedUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        })
        if (!invitedUser) {
            throw new Error("User not found")
        }

        const existingMember = await db.query.members.findFirst({
            where: and(
                eq(members.userId, invitedUser.id),
                eq(members.workspaceId, workspaceId)
            ),
        })

        if(existingMember) {
            throw new Error("User is already a member")
        }

        await db.insert(members).values({
            userId: invitedUser.id,
            workspaceId,
            role,
        })

        await db.insert(activities).values({
            workspaceId,
            userId,
            action: "invited_member",
            entityType: "member",
            entityId: invitedUser.id,
            metadata: {email, role},
        })
        return {success: true}
    }
)

export const removeMember = createAction(
    removeMemberSchema,
    async (data, userId) => {
        const { userId: memberToRemove, workspaceId } = data;

        const requester = await db.query.members.findFirst({
            where: and(
                eq(members.userId, userId),
                eq(members.workspaceId, workspaceId)
            ),
        })

        if (!requester || requester.role === "member") {
            throw new Error("Only owner or admin can remove members")
        }

        const deleted = await db.delete(members)
            .where(and(
                eq(members.userId, memberToRemove),
                eq(members.workspaceId, workspaceId)
            ))
            .returning()

        if (!deleted.length) {
            throw new Error("Member not found in workspace")
        }

        await db.insert(activities).values({
            workspaceId,
            userId,
            action: "removed_member",
            entityType: "member",
            entityId: memberToRemove,
            metadata: {},
        })

        return { success: true }
    }
)

