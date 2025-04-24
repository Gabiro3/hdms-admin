"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  LifeBuoy,
  BarChart,
  Building,
  FileChartLineIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSessionRefresh } from "@/hooks/use-session-refresh"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Add this line to use the session refresh hook
  useSessionRefresh()

  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Get user profile data
        const { data } = await supabase.from("users").select("*, hospitals(name)").eq("id", user.id).single()
        setUserProfile(data)

        // Check if user is an admin
        if (!data?.is_admin) {
          // Redirect non-admin users to the dashboard
          router.push("/unauthorized")
        }
      }

      setLoading(false)

      if (!user) {
        router.push("/login")
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login")
      } else if (session) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Diagnoses", href: "/admin/diagnoses", icon: FileText },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Hospitals", href: "/admin/hospitals", icon: Building },
    { name: "Blling", href: "/admin/billing", icon: FileChartLineIcon },
    { name: "Support", href: "/admin/support", icon: LifeBuoy },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="fixed inset-0 z-40 lg:hidden">
        {sidebarOpen ? (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          ></div>
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white transition duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold">Admin Panel</span>
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col h-full">
            <div className="px-3 py-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`sidebar-link ${isActive ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={`sidebar-icon ${isActive ? "text-primary" : ""}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="mt-auto p-4">
              <div className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>{userProfile?.full_name ? getInitials(userProfile.full_name) : "A"}</AvatarFallback>
                </Avatar>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{userProfile?.full_name}</p>
                  <p className="truncate text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 flex w-full items-center justify-center"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <div className="flex items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-lg font-semibold">Admin Panel</span>
              </div>
            </div>
            <div className="flex flex-col h-full">
              <div className="px-3 py-4">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    return (
                      <Link key={item.name} href={item.href} className={`sidebar-link ${isActive ? "active" : ""}`}>
                        <item.icon className={`sidebar-icon ${isActive ? "text-primary" : ""}`} />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="mt-auto p-4">
                <div className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{userProfile?.full_name ? getInitials(userProfile.full_name) : "A"}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{userProfile?.full_name}</p>
                    <p className="truncate text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 flex w-full items-center justify-center"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              <div className="max-w-2xl w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    placeholder="Search"
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span className="absolute -inset-1.5"></span>
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>
                        {userProfile?.full_name ? getInitials(userProfile.full_name) : "A"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/admin/profile" className="flex w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/admin/settings" className="flex w-full">
                      Settings
                    </Link>{" "}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
