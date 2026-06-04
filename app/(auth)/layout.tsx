export const metadata = {
    title: "Syncro Flow",
    description: "Collaborative workspace for teams",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      {children}
    </main>
  )
}