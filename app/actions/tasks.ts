"use server"

import { createAction } from "@/app/lib/safe.actions"
import {
    assignTaskSchema,
    createTaskSchema,
    deleteTaskSchema,
    updateTaskDetailsSchema,
    updateTaskStatusSchema,
} from "@/app/lib/validations/tasks"
import { db } from "@/app/lib/db"
import { tasks, members, activities } from "@/app/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { pusherServer } from "../lib/pusher/server"

async function assertWorkspaceMember(workspaceId: string, userId: string) {
    const member = await db.query.members.findFirst({
        where: and(eq(members.userId, userId), eq(members.workspaceId, workspaceId)),
    })
    if (!member) {
        throw new Error("You are not a member of this workspace")
    }
}

async function getTaskAndAssertMember(taskId: string, userId: string) {
    const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
    })

    if (!task) {
        throw new Error("Task not found")
    }

    await assertWorkspaceMember(task.workspaceId, userId)
    return task
}

async function triggerWorkspaceEvent(
    workspaceId: string,
    eventName: string,
    payload: Record<string, unknown>
) {
    try {
        await pusherServer.trigger(`workspace-${workspaceId}`, eventName, payload)
    } catch (error) {
        console.error(
            `Failed to publish ${eventName} for workspace ${workspaceId}`,
            error
        )
    }
}

export const createTask = createAction(createTaskSchema, async (data, userId) => {
    const { title, description, priority, assigneeId, workspaceId } = data

    await assertWorkspaceMember(workspaceId, userId)
    if (assigneeId) {
        await assertWorkspaceMember(workspaceId, assigneeId)
    }

    const newTask = await db
        .insert(tasks)
        .values({
            title,
            description,
            priority,
            assigneeId,
            workspaceId,
            createdBy: userId,
        })
        .returning()

    if (!newTask[0]) {
        throw new Error("Failed to create a task")
    }

    await db.insert(activities).values({
        workspaceId,
        userId,
        action: "created_task",
        entityType: "task",
        entityId: newTask[0].id,
        metadata: { title },
    })

    await triggerWorkspaceEvent(workspaceId, "task-created", {
        taskId: newTask[0].id,
        title,
        description,
        priority,
        assigneeId,
        workspaceId,
        createdBy: userId,
    })

    return newTask[0]
})

export const updateTaskStatus = createAction(
    updateTaskStatusSchema,
    async (data, userId) => {
        const { taskId, status } = data
        const task = await getTaskAndAssertMember(taskId, userId)

        const updatedTask = await db
            .update(tasks)
            .set({ status })
            .where(eq(tasks.id, taskId))
            .returning()

        if (!updatedTask[0]) {
            throw new Error("Failed to update task status")
        }

        await db.insert(activities).values({
            workspaceId: task.workspaceId,
            userId,
            action: "updated_task_status",
            entityType: "task",
            entityId: taskId,
            metadata: { taskId, status },
        })

        await triggerWorkspaceEvent(task.workspaceId, "task-status-updated", {
            taskId,
            status,
            updatedBy: userId,
        })

        return updatedTask[0]
    }
)

export const assignTask = createAction(assignTaskSchema, async (data, userId) => {
    const { taskId, assigneeId } = data
    const task = await getTaskAndAssertMember(taskId, userId)

    if (assigneeId) {
        await assertWorkspaceMember(task.workspaceId, assigneeId)
    }

    const updatedTask = await db
        .update(tasks)
        .set({ assigneeId })
        .where(eq(tasks.id, taskId))
        .returning()

    if (!updatedTask[0]) {
        throw new Error("Failed to assign task")
    }

    await db.insert(activities).values({
        workspaceId: task.workspaceId,
        userId,
        action: "assigned_task",
        entityType: "task",
        entityId: taskId,
        metadata: { taskId, assigneeId },
    })

    await triggerWorkspaceEvent(task.workspaceId, "task-assigned", {
        taskId,
        assigneeId,
        updatedBy: userId,
    })

    return updatedTask[0]
})

export const updateTaskDetails = createAction(
    updateTaskDetailsSchema,
    async (data, userId) => {
        const { taskId, title, description, priority } = data
        const task = await getTaskAndAssertMember(taskId, userId)

        const updatedTask = await db
            .update(tasks)
            .set({
                title,
                description,
                priority,
            })
            .where(eq(tasks.id, taskId))
            .returning()

        if (!updatedTask[0]) {
            throw new Error("Failed to update task")
        }

        await db.insert(activities).values({
            workspaceId: task.workspaceId,
            userId,
            action: "updated_task",
            entityType: "task",
            entityId: taskId,
            metadata: { taskId, title, priority },
        })

        await triggerWorkspaceEvent(task.workspaceId, "task-updated", {
            taskId,
            title,
            description,
            priority,
            updatedBy: userId,
        })

        return updatedTask[0]
    }
)

export const deleteTask = createAction(deleteTaskSchema, async (data, userId) => {
    const { taskId } = data
    const task = await getTaskAndAssertMember(taskId, userId)

    const deletedTask = await db.delete(tasks).where(eq(tasks.id, taskId)).returning()
    if (!deletedTask[0]) {
        throw new Error("Failed to delete task")
    }

    await db.insert(activities).values({
        workspaceId: task.workspaceId,
        userId,
        action: "deleted_task",
        entityType: "task",
        entityId: taskId,
        metadata: { taskId, title: task.title },
    })

    await triggerWorkspaceEvent(task.workspaceId, "task-deleted", {
        taskId,
        deletedBy: userId,
    })

    return { id: taskId }
})