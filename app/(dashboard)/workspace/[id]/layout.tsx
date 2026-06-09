import { redirect } from "next/navigation"
import { getWorkspacePageData } from "@/app/actions/queries"
import { WorkspaceProvider } from "@/app/providers/workspace-provider"
import { WorkspaceShell } from "@/components/workspace/workspace-shell"

export default async function WorkspaceLayout({
    children,
    activity,
    tasks,
    params,
}: {
    children: React.ReactNode
    activity: React.ReactNode
    tasks: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const result = await getWorkspacePageData(id)

    if (!result.success) {
        redirect("/onboarding")
    }

    return (
        <WorkspaceProvider workspaceId={id} initial={result.data}>
            <WorkspaceShell activity={activity} tasks={tasks}>
                {children}
            </WorkspaceShell>
        </WorkspaceProvider>
    )
}
