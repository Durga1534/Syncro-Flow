"use client"

import { useState } from "react"
import { inviteMember, removeMember } from "@/app/actions/workspace"
import { useWorkspace } from "@/app/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function InviteMemberForm() {
    const { workspace, members, currentUserRole, refresh } = useWorkspace()
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<"admin" | "member">("member")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const canManage = currentUserRole === "owner" || currentUserRole === "admin"
    const isOwner = currentUserRole === "owner"

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        const result = await inviteMember({
            workspaceId: workspace.id,
            email: email.trim(),
            role,
        })

        if (result.success) {
            setSuccess(`Invitation sent to ${email}`)
            setEmail("")
            await refresh()
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    const handleRemove = async (userId: string) => {
        if (!confirm("Remove this member from the workspace?")) return
        setLoading(true)
        const result = await removeMember({
            workspaceId: workspace.id,
            userId,
        })
        if (result.success) {
            await refresh()
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            {isOwner && (
                <form onSubmit={handleInvite} className="space-y-3">
                    <h3 className="font-semibold text-foreground">Invite Member</h3>
                    <div className="flex gap-2">
                        <Input
                            type="email"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="flex-1"
                        />
                        <select
                            value={role}
                            onChange={(e) =>
                                setRole(e.target.value as "admin" | "member")
                            }
                            disabled={loading}
                            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                        <Button type="submit" disabled={loading || !email.trim()}>
                            Invite
                        </Button>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {success && (
                        <p className="text-sm text-emerald-600">{success}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        User must already have an account with this email.
                    </p>
                </form>
            )}

            <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                    Members ({members.length})
                </h3>
                <div className="divide-y rounded-lg border">
                    {members.map((member) => (
                        <div
                            key={member.userId}
                            className="flex items-center justify-between p-3"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0"
                                    style={
                                        member.user.avatar
                                            ? {
                                                  backgroundImage: `url(${member.user.avatar})`,
                                                  backgroundSize: "cover",
                                              }
                                            : undefined
                                    }
                                >
                                    {!member.user.avatar &&
                                        (member.user.name ||
                                            member.user.email)[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {member.user.name || "Unnamed"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {member.user.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded">
                                    {member.role}
                                </span>
                                {canManage &&
                                    member.role !== "owner" &&
                                    member.userId !== workspace.ownerId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleRemove(member.userId)
                                            }
                                            disabled={loading}
                                            className="text-destructive"
                                        >
                                            Remove
                                        </Button>
                                    )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
