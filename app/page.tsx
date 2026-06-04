'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function Page() {
  const { userId, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return

    if (userId) {
      // User is signed in, redirect to onboarding or dashboard
      router.push('/onboarding')
    } else {
      // User is not signed in, redirect to sign-in
      router.push('/sign-in')
    }
  }, [userId, isLoaded, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )
}