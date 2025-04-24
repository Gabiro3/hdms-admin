import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileSearch } from "lucide-react"

export default function DiagnosisNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <FileSearch className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Diagnosis not found</h1>
      <p className="mt-4 text-center text-gray-600 max-w-md">
        The diagnosis you are looking for does not exist or you do not have permission to view it.
      </p>
      <Link href="/admin/diagnoses" className="mt-8">
        <Button>Return to Diagnoses</Button>
      </Link>
    </div>
  )
}
