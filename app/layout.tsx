import type React from "react"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"

export const metadata = {
  title: "Hospital Diagnosis Management System",
  description: "A comprehensive diagnosis management system for hospitals",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
