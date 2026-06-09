"use client"

import { Circle } from "lucide-react"
import { useWorkspace } from "@/app/providers/workspace-provider"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"

export function AssignedTasksPanel() {
    const { tasks, currentUserId } = useWorkspace()
    const myTasks = tasks.filter((t) => t.assigneeId === currentUserId)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                    {myTasks.length === 0
                        ? "No tasks assigned"
                        : `${myTasks.length} assigned to you`}
                </p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
                {myTasks.length === 0 ? (
                    <div className="flex items-start gap-3 p-2 rounded">
                        <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                            Tasks assigned to you appear here
                        </p>
                    </div>
                ) : (
                    myTasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-start gap-3 p-2 hover:bg-muted rounded transition"
                        >
                            <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate">
                                    {task.title}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {task.status?.replace("_", " ")}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CreateTaskDialog />
        </div>
    )
}
