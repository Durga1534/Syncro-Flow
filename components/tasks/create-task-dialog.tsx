"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { createTask } from "@/app/actions/tasks"
import { useWorkspace } from "@/app/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreateTaskDialog() {
    const { workspace, members, setTasks } = useWorkspace()
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [priority, setPriority] = useState<"low" | "medium" | "high">("low")
    const [assigneeId, setAssigneeId] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const reset = () => {
        setTitle("")
        setDescription("")
        setPriority("low")
        setAssigneeId("")
        setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        setError("")

        const result = await createTask({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            assigneeId: assigneeId || undefined,
            workspaceId: workspace.id,
        })

        if (result.success) {
            setTasks((prev) => {
                if (prev.some((t) => t.id === result.data.id)) return prev
                const assignee = result.data.assigneeId
                    ? members.find((m) => m.userId === result.data.assigneeId)
                          ?.user ?? null
                    : null
                return [{ ...result.data, assignee }, ...prev]
            })
            reset()
            setOpen(false)
        } else {
            setError(result.error)
        }

        setLoading(false)
    }

    if (!open) {
        return (
            <Button className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                New Task
            </Button>
        )
    }

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground">Create Task</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">
                        Title
                    </label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        disabled={loading}
                        className="mt-1"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional details..."
                        disabled={loading}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">
                            Priority
                        </label>
                        <select
                            value={priority}
                            onChange={(e) =>
                                setPriority(
                                    e.target.value as "low" | "medium" | "high"
                                )
                            }
                            disabled={loading}
                            className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">
                            Assignee
                        </label>
                        <select
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            disabled={loading}
                            className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                        >
                            <option value="">Unassigned</option>
                            {members.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                    {m.user.name || m.user.email}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {error && (
                    <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="flex gap-2">
                    <Button type="submit" disabled={loading || !title.trim()}>
                        {loading ? "Creating..." : "Create"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            reset()
                            setOpen(false)
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
