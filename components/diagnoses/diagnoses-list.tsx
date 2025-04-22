"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

interface DiagnosesListProps {
  hospitalId: string
}

interface Diagnosis {
  id: string
  title: string
  created_at: string
  patient_id: string
  users: {
    full_name: string
  }
  image_links: string[] | null
}

export default function DiagnosesList({ hospitalId }: DiagnosesListProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState<"table" | "grid">("table")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchDiagnoses = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("diagnoses")
          .select(`
            id,
            title,
            created_at,
            patient_id,
            image_links,
            users (
              full_name
            )
          `)
          .eq("hospital_id", hospitalId)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setDiagnoses(data || [])
      } catch (error) {
        console.error("Error fetching diagnoses:", error)
      } finally {
        setLoading(false)
      }
    }

    if (hospitalId) {
      fetchDiagnoses()
    }
  }, [hospitalId, supabase])

  const filteredDiagnoses = diagnoses.filter(
    (diagnosis) =>
      diagnosis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diagnosis.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diagnosis.users?.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search diagnoses..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-review">In Review</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border bg-white p-1">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("table")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
            </Button>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setView("grid")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg border bg-white"></div>
          ))}
        </div>
      ) : filteredDiagnoses.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No diagnoses found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn't find any diagnoses matching your search criteria.
          </p>
          <Link href="/diagnoses/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Diagnosis
            </Button>
          </Link>
        </div>
      ) : view === "table" ? (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Images</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiagnoses.map((diagnosis) => (
                <TableRow key={diagnosis.id}>
                  <TableCell className="font-medium">{diagnosis.title}</TableCell>
                  <TableCell>{diagnosis.patient_id}</TableCell>
                  <TableCell>{diagnosis.users?.full_name}</TableCell>
                  <TableCell>{format(new Date(diagnosis.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {diagnosis.image_links && diagnosis.image_links.length > 0 ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {diagnosis.image_links.length}
                      </Badge>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Link href={`/diagnoses/${diagnosis.id}`} className="flex w-full">
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDiagnoses.map((diagnosis) => (
            <Link key={diagnosis.id} href={`/diagnoses/${diagnosis.id}`}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {diagnosis.image_links ? `${diagnosis.image_links.length} images` : "No images"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(diagnosis.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-medium">{diagnosis.title}</h3>
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                    <span>Patient: {diagnosis.patient_id}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <span>Doctor: {diagnosis.users?.full_name}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
