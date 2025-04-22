import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // This refreshes the user's session if needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check auth condition
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/signup") ||
    req.nextUrl.pathname.startsWith("/reset-password")

  // Check if it's an admin route
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

  // If user is not signed in and the route requires authentication, redirect to login
  if (!session && !isAuthRoute && req.nextUrl.pathname !== "/") {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and trying to access auth routes, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/admin", req.url))
  }

  // If user is trying to access admin routes, check if they're an admin
  if (isAdminRoute && session) {
    // Get the user's admin status
    const { data } = await supabase.from("users").select("is_admin").eq("id", session.user.id).single()

    // If not an admin, redirect to dashboard
    if (!data?.is_admin) {
      return NextResponse.redirect(new URL("/unathorized", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/public).*)"],
}
