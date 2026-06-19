"use client"

import { useState } from "react"
import {
    assignTask,
    deleteTask,
    updateTaskDetails,
    updateTaskStatus,
} from "@/app/actions/tasks"
import { useWorkspace } from "@/app/providers/workspace-provider"
import type { TaskPriority, TaskStatus, TaskWithRelations } from "@/app/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description ?? "")
    const [priority, setPriority] = useState<TaskPriority>(task.priority ?? "low")
    const [error, setError] = useState("")

    const handleStatusChange = async (status: TaskStatus) => {
        if (status === task.status) return
        setLoading(true)
        setError("")
        const result = await updateTaskStatus({ taskId: task.id, status })
        if (result.success) {
            setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, ...result.data } : t))
            )
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    const handleAssigneeChange = async (assigneeId: string) => {
        setLoading(true)
        setError("")
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
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Title is required")
            return
        }

        setLoading(true)
        setError("")
        const result = await updateTaskDetails({
            taskId: task.id,
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
        })

        if (result.success) {
            setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, ...result.data } : t))
            )
            setIsEditing(false)
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        setLoading(true)
        setError("")
        const result = await deleteTask({ taskId: task.id })
        if (result.success) {
            setTasks((prev) => prev.filter((t) => t.id !== task.id))
        } else {
            setError(result.error)
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
            {isEditing ? (
                <div className="space-y-2">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                        placeholder="Task title"
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                        placeholder="Task description"
                    />
                    <select
                        value={priority}
                        onChange={(e) =>
                            setPriority(e.target.value as "low" | "medium" | "high")
                        }
                        className="h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            ) : (
                task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )
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
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                                setTitle(task.title)
                                setDescription(task.description ?? "")
                                setPriority(task.priority ?? "low")
                                setIsEditing(false)
                                setError("")
                            }}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setIsEditing(true)}
                            disabled={loading}
                        >
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Remove
                        </Button>
                    </>
                )}
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
    )
}
