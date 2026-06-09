"use client"

import { Users } from "lucide-react"
import Link from "next/link"
import { useWorkspace } from "@/app/providers/workspace-provider"
import { TaskBoard } from "@/components/tasks/task-board"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function WorkspacePage() {
    const { workspace, tasks, members } = useWorkspace()

    const doneCount = tasks.filter((t) => t.status === "done").length
    const inProgressCount = tasks.filter(
        (t) => t.status === "in_progress"
    ).length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    {workspace.name}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Collaborate in real time with your team
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Members
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{members.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tasks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgressCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Done
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{doneCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage your workspace</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href={`/workspace/${workspace.id}/members`}>
                            <Users className="h-4 w-4" />
                            Manage Members
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <TaskBoard />
        </div>
    )
}
