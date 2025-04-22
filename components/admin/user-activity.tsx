"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface UserActivity {
  id: string
  full_name: string
  email: string
  last_login: string
  diagnosisCount: number
}

export default function AdminUserActivity() {
  const [users, setUsers] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRecentUsers = async () => {
      setLoading(true)
      try {
        // Get users with recent activity
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, full_name, email, last_login")
          .order("last_login", { ascending: false })
          .limit(5)

        if (userError) throw userError

        // For each user, get their diagnosis count
        const usersWithActivity = await Promise.all(
          userData.map(async (user) => {
            const { count } = await supabase
              .from("diagnoses")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)

            return {
              ...user,
              diagnosisCount: count || 0,
            }
          }),
        )

        setUsers(usersWithActivity)
      } catch (error) {
        console.error("Error fetching user activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentUsers()
  }, [supabase])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded bg-gray-200"></div>
                    <div className="h-3 w-24 rounded bg-gray-200"></div>
                  </div>
                </div>
                <div className="h-4 w-20 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No recent user activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm font-medium">{user.diagnosisCount} diagnoses</p>
                  <p className="text-xs text-muted-foreground">
                    {user.last_login
                      ? `Active ${formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}`
                      : "Never logged in"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
