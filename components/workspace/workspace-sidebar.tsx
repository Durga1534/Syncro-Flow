"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "@clerk/nextjs"
import { LayoutDashboard, LogOut, Users, Wifi, WifiOff } from "lucide-react"
import { useWorkspace } from "@/app/providers/workspace-provider"
import { Button } from "@/components/ui/button"
import {
    Sidebar,
    SidebarContent,
} from "@/components/ui/sidebar"
export function WorkspaceSidebar() {
    const pathname = usePathname()
    const { workspace, isConnected } = useWorkspace()
    const base = `/workspace/${workspace.id}`

    const links = [
        { href: base, label: "Dashboard", icon: LayoutDashboard },
        { href: `${base}/members`, label: "Members", icon: Users },
    ]

    return (
        <Sidebar className="border-r">
            <SidebarContent className="flex flex-col h-full">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-foreground truncate">
                        {workspace.name}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        {isConnected ? (
                            <Wifi className="h-3 w-3 text-emerald-500" />
                        ) : (
                            <WifiOff className="h-3 w-3 text-amber-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                            {isConnected ? "Live" : "Polling"}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {links.map(({ href, label, icon: Icon }) => {
                        const active =
                            href === base
                                ? pathname === base
                                : pathname.startsWith(href)
                        return (
                            <Button
                                key={href}
                                variant={active ? "default" : "ghost"}
                                className="w-full justify-start gap-2"
                                asChild
                            >
                                <Link href={href}>
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            </Button>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <SignOutButton>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </SignOutButton>
                </div>
            </SidebarContent>
        </Sidebar>
    )
}
