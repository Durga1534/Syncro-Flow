"use client"

import { useState } from "react"
import { assignTask, updateTaskStatus } from "@/app/actions/tasks"
import { useWorkspace } from "@/app/providers/workspace-provider"
import type { TaskStatus, TaskWithRelations } from "@/app/lib/types"
import { cn } from "@/lib/utils"

const priorityStyles = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
}

const statuses: TaskStatus[] = ["todo", "in_progress", "done", "blocked"]

function formatStatus(status: TaskStatus) {
    return status.replace("_", " ")
}

export function TaskCard({ task }: { task: TaskWithRelations }) {
    const { members, setTasks } = useWorkspace()
    const [loading, setLoading] = useState(false)

    const handleStatusChange = async (status: TaskStatus) => {
        if (status === task.status) return
        setLoading(true)
        const result = await updateTaskStatus({ taskId: task.id, status })
        if (result.success) {
            setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, ...result.data } : t))
            )
        }
        setLoading(false)
    }

    const handleAssigneeChange = async (assigneeId: string) => {
        setLoading(true)
        const result = await assignTask({
            taskId: task.id,
            assigneeId: assigneeId || undefined,
        })
        if (result.success) {
            const assignee = result.data.assigneeId
                ? members.find((m) => m.userId === result.data.assigneeId)
                      ?.user ?? null
                : null
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === task.id ? { ...t, ...result.data, assignee } : t
                )
            )
        }
        setLoading(false)
    }

    return (
        <div
            className={cn(
                "rounded-lg border bg-card p-3 shadow-sm space-y-2",
                loading && "opacity-60 pointer-events-none"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground leading-snug">
                    {task.title}
                </p>
                <span
                    className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                        priorityStyles[task.priority ?? "low"]
                    )}
                >
                    {task.priority}
                </span>
            </div>
            {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {task.description}
                </p>
            )}
            <select
                value={task.status ?? "todo"}
                onChange={(e) =>
                    handleStatusChange(e.target.value as TaskStatus)
                }
                className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs capitalize"
            >
                {statuses.map((s) => (
                    <option key={s} value={s}>
                        {formatStatus(s)}
                    </option>
                ))}
            </select>
            <select
                value={task.assigneeId ?? ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs"
            >
                <option value="">Unassigned</option>
                {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                        {m.user.name || m.user.email}
                    </option>
                ))}
            </select>
        </div>
    )
}
