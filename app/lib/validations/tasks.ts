import { z } from "zod"

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is too short").max(256, "Title is too long"),
    description: z.string().max(1000, "Description is too long").optional(),
    priority: z.enum(["low", "medium", "high"]).default("low"),
    assigneeId: z.string().min(1, "Assignee ID is required").optional(),
    workspaceId: z.string().min(1, "Workspace ID is required"),
})

export const updateTaskStatusSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
    status: z.enum(["todo", "in_progress", "done", "blocked"]).default("todo"),
})

export const assignTaskSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
    assigneeId: z.string().min(1, "Assignee ID is required").optional(),
})

export const updateTaskDetailsSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
    title: z.string().min(1, "Title is too short").max(256, "Title is too long"),
    description: z.string().max(1000, "Description is too long").optional(),
    priority: z.enum(["low", "medium", "high"]).default("low"),
})

export const deleteTaskSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
})

export type CreateTaskSchema = z.infer<typeof createTaskSchema>
export type UpdateTaskStatusSchema = z.infer<typeof updateTaskStatusSchema>
export type AssignTaskSchema = z.infer<typeof assignTaskSchema>
export type UpdateTaskDetailsSchema = z.infer<typeof updateTaskDetailsSchema>
export type DeleteTaskSchema = z.infer<typeof deleteTaskSchema>