import { UserButton } from "@clerk/nextjs"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-medium mb-4">Dashboard</h1>
      <UserButton />
    </div>
  )
}