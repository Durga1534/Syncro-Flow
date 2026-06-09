"use client"

import { InviteMemberForm } from "@/components/workspace/invite-member-dialog"
import { ActivityFeed } from "@/components/workspace/activity-feed"
import { useWorkspace } from "@/app/providers/workspace-provider"

export default function MembersPage() {
    const { workspace } = useWorkspace()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Members</h1>
                <p className="text-muted-foreground mt-1">
                    Manage who has access to {workspace.name}
                </p>
            </div>

            <InviteMemberForm />

            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    Recent Activity
                </h3>
                <ActivityFeed limit={10} />
            </div>
        </div>
    )
}
