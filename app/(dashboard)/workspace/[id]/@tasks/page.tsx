"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle ,Plus } from "lucide-react"

export default function TasksSlot() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">No tasks assigned</p>
                <Button size="sm" variant="ghost" className="gap-1">
                    <Plus className="h-3 w-4" />
                    Add
                </Button>
            </div>

            <div className="space-y-2">
                <div className="flex items-start gap-3 p-2 hover:bg-muted rounded cursor-pointer transition">
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">Start adding tasks...</p>
                    </div>
                </div>
            </div>

            <Button variant="outline" size="sm" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                New Task
            </Button>
        </div>
    )
}