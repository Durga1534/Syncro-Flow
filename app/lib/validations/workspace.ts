import { z } from "zod"

export const createWorkspaceSchema = z.object({
    name: z.string().min(3, "Name is required").max(50, "Name is too long"),
})

export const inviteMemberSchema = z.object({
    workspaceId: z.string().min(1, "Workspace ID is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["owner", "admin", "member"]).default("member"),
})

export const removeMemberSchema = z.object({
    workspaceId: z.string().min(1, "Workspace ID is required"),
    userId: z.string().min(1, "User ID is required"),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>