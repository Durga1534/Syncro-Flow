"use client"

import type { TaskStatus, TaskWithRelations } from "@/app/lib/types"
import { TaskCard } from "./task-card"

function formatStatus(status: TaskStatus) {
    return status.replace("_", " ")
}

export function TaskColumn({
    status,
    tasks,
}: {
    status: TaskStatus
    tasks: TaskWithRelations[]
}) {
    return (
        <div className="flex flex-col min-w-[220px] flex-1">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold capitalize text-foreground">
                    {formatStatus(status)}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {tasks.length}
                </span>
            </div>
            <div className="space-y-2 flex-1">
                {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                        No tasks
                    </p>
                ) : (
                    tasks.map((task) => <TaskCard key={task.id} task={task} />)
                )}
            </div>
        </div>
    )
}
