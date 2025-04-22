"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

/**
 * Hook to periodically refresh the user's session
 * @param intervalMinutes How often to refresh the session in minutes
 */
export function useSessionRefresh(intervalMinutes = 15) {
  const { refreshSession } = useAuth()

  useEffect(() => {
    // Initial refresh
    refreshSession()

    // Set up interval for periodic refreshes
    const interval = setInterval(
      () => {
        refreshSession()
      },
      intervalMinutes * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [refreshSession, intervalMinutes])
}
