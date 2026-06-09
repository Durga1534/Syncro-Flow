"use client"

import { useWorkspace } from "@/app/providers/workspace-provider"
import type { TaskStatus } from "@/app/lib/types"
import { CreateTaskDialog } from "./create-task-dialog"
import { TaskColumn } from "./task-column"

const columns: TaskStatus[] = ["todo", "in_progress", "done", "blocked"]

export function TaskBoard() {
    const { tasks } = useWorkspace()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Task Board</h2>
                <CreateTaskDialog />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {columns.map((status) => (
                    <TaskColumn
                        key={status}
                        status={status}
                        tasks={tasks.filter((t) => (t.status ?? "todo") === status)}
                    />
                ))}
            </div>
        </div>
    )
}
