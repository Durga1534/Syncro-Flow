"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { WorkspaceSidebar } from "./workspace-sidebar"

export function WorkspaceShell({
    children,
    tasks,
    activity,
}: {
    children: React.ReactNode
    tasks: React.ReactNode
    activity: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-background">
                <WorkspaceSidebar />
                <main className="flex-1 overflow-auto">
                    <div className="p-6 lg:p-8">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <div className="xl:col-span-2 space-y-6">
                                {children}
                            </div>
                            <div className="space-y-6">
                                <div className="bg-card border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">
                                        My Tasks
                                    </h3>
                                    {tasks}
                                </div>
                                <div className="bg-card border rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">
                                        Activity
                                    </h3>
                                    {activity}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}
