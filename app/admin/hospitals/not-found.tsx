import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building } from "lucide-react"

export default function HospitalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <Building className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Hospital not found</h1>
      <p className="mt-4 text-center text-gray-600 max-w-md">
        The hospital you are looking for does not exist or you do not have permission to view it.
      </p>
      <Link href="/admin/hospitals" className="mt-8">
        <Button>Return to Hospitals</Button>
      </Link>
    </div>
  )
}
