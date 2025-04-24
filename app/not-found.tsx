import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <Search className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">404</h1>
      <h2 className="mt-2 text-xl font-semibold">Page not found</h2>
      <p className="mt-4 text-center text-gray-600 max-w-md">
        The page you are looking for does not exist or you do not have permission to view it.
      </p>
      <Link href="/admin" className="mt-8">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  )
}
