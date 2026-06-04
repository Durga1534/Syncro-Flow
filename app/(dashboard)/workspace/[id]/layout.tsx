import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function WorkspaceLayout({
    children,
    activity,
    tasks
}: {
    children: React.ReactNode
    activity: React.ReactNode
    tasks: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full bg-background">
                {/* Sidebar */}
                <Sidebar className="border-r">
                    <SidebarContent className="flex flex-col">
                        <div className="p-6 border-b">
                            <h1 className="text-2xl font-bold text-foreground">Syncro Flow</h1>
                        </div>

                        <nav className="flex-1 p-4 space-y-2">
                            <Button
                                variant="default"
                                className="w-full justify-start"
                            >
                                Dashboard
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                            >
                                Settings
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                            >
                                Members
                            </Button>
                        </nav>

                        <div className="p-4 border-t space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </SidebarContent>
                </Sidebar>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-8">
                        <div className="grid grid-cols-3 gap-6">
                            {/* Main Content Area */}
                            <div className="col-span-2">
                                {children}
                            </div>

                            {/* Right Sidebar - Tasks & Activity */}
                            <div className="space-y-6">
                                {/* Task Section */}
                                <div className="bg-card border rounded-lg p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Tasks</h3>
                                    <div className="space-y-3">
                                        {tasks}
                                    </div>
                                </div>

                                {/* Activity Section */}
                                <div className="bg-card border rounded-lg p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Activity</h3>
                                    <div className="space-y-3">
                                        {activity}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}