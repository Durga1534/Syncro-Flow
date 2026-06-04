"use client"

import {Clock, Users, Zap} from "lucide-react"

export default function ActivitySlot() {
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {/* Activity Item */}
                <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Workspace created</p>
                        <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                </div>

                {/* Placeholder for more activities */}
                <div className="flex items-center justify-center py-6 text-center">
                    <p className="text-xs text-muted-foreground">More activities will appear here</p>
                </div>
            </div>

            <button className="text-xs text-primary hover:underline w-full text-center py-2">
                View all activity
            </button>
        </div>
    )
}