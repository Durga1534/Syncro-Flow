"use server"

import { createAction } from "@/app/lib/safe.actions"
import { createTaskSchema, updateTaskStatusSchema, assignTaskSchema } from "@/app/lib/validations/tasks"
import { db } from "@/app/lib/db"
import { tasks, members, activities } from "@/app/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { pusherServer } from "../lib/pusher/client"

export const createTask = createAction(
    createTaskSchema,
    async (data, userId) => {
        const {title, description, priority, assigneeId, workspaceId} = data;

        const member = await db.query.members.findFirst({
            where: and (
                eq(members.userId, userId),
                eq(members.workspaceId, workspaceId)
            )
        })

        if(!member) {
            throw new Error("You are not a member of this workspace")
        }

        const newTask = await db.insert(tasks).values({
            title,
            description,
            priority,
            assigneeId,
            workspaceId,
            createdBy: userId,
        }).returning()

        if(!newTask[0]) {
            throw new Error("Failed to create a task")
        }

        // publish to pusher -all subscribed clients receive this instantly
         await pusherServer.trigger(
            `workspace-${workspaceId}`,
            "task-created",
            {
                taskId: newTask[0].id,
                title,
                description,
                priority,
                assigneeId,
                workspaceId,
                createdBy: userId,
            }
         )

        await db.insert(activities).values({
            workspaceId,
            userId,
            action: "created_task",
            entityType: "task",
            entityId: newTask[0].id,
            metadata: { title },
        })
        return newTask[0]
    }
)


export const updateTaskStatus = createAction(
    updateTaskStatusSchema,
    async (data, userId) => {
        const {taskId, status} = data;

        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
        })

        if (!task) {
            throw new Error("Task not found")
        }

        const member = await db.query.members.findFirst({
            where: and(
                eq(members.userId, userId),
                eq(members.workspaceId, task.workspaceId)
            )
        })

        if (!member) {
            throw new Error("You are not a member of this workspace")
        }

        const updateTaskStatus = await db.update(tasks)
            .set({status})
            .where(eq(tasks.id, taskId))
            .returning()

          if(!updateTaskStatus[0]) {
            throw new Error("Failed to update task status")
        }

        // publish to pusher -all subscribed clients receive this instantly
        await pusherServer.trigger(
            `workspace-${task.workspaceId}`,
            "task-status-updated",
            {
                taskId,
                status,
                updatedBy: userId,
            }
        )
        
        await db.insert(activities).values({
            workspaceId: task.workspaceId,
            userId,
            action: "updated_task_status",
            entityType: "task",
            entityId: taskId,
            metadata: { taskId, status },
        })
        return updateTaskStatus[0]
    }

)

export const assignTask = createAction(
    assignTaskSchema,
    async(data,userId) => {
        const {taskId, assigneeId} = data;

        const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId),
        })

        if(!task) {
            throw new Error("Task not found")
        }

        const member = await db.query.members.findFirst({
            where: and(
                eq(members.userId, userId),
                eq(members.workspaceId, task.workspaceId)
            )
        })
        
        if(!member) {
            throw new Error("You are not a member of this workspace")
        }

        if (assigneeId) {
            const assignee = await db.query.members.findFirst({
                where: and(
                    eq(members.userId, assigneeId),
                    eq(members.workspaceId, task.workspaceId)
                )
            })
            if(!assignee) {
                throw new Error("Assignee is not a member of this workspace")
            }
        }

        const assignTask = await db.update(tasks)
                .set({ assigneeId })
                .where(eq(tasks.id, taskId))
                .returning()

         if(!assignTask[0]) {
            throw new Error("Failed to assign task")    
        }
        
        // publish to pusher -all subscribed clients receive this instantly
        await pusherServer.trigger(
            `workspace-${task.workspaceId}`,
            "task-assigned",
            {
                taskId,
                assigneeId,
                updatedBy: userId,
            }
        )

        await db.insert(activities).values({
            workspaceId: task.workspaceId,
            userId,
            action: "assigned_task",
            entityType: "task",
            entityId: taskId,
            metadata: { taskId, assigneeId },
        })

        return assignTask[0]
    }
)