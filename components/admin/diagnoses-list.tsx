"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Eye, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiRequest } from "@/lib/utils/api-client"

interface Diagnosis {
  id: string
  title: string
  created_at: string
  patient_id: string
  hospital_id: string
  user_id: string
  image_links: string[] | null
  users: {
    full_name: string
    email: string
  }
  hospitals: {
    name: string
    code: string
  }
}

interface AdminDiagnosesListProps {
  initialDiagnoses: Diagnosis[]
  initialTotal: number
  initialPage: number
  initialLimit: number
  initialTotalPages: number
}

export default function AdminDiagnosesList({
  initialDiagnoses,
  initialTotal,
  initialPage,
  initialLimit,
  initialTotalPages,
}: AdminDiagnosesListProps) {
  const router = useRouter()
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(initialDiagnoses)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(initialTotal)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hospitalFilter, setHospitalFilter] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Fetch hospitals for filtering
    const fetchHospitals = async () => {
      const { data } = await supabase.from("hospitals").select("id, name").order("name")
      if (data) {
        setHospitals(data)
      }
    }

    fetchHospitals()
  }, [supabase])

  const fetchDiagnoses = async () => {
    setLoading(true)
    try {
      const response = await apiRequest(
        `/api/admin/diagnoses?page=${page}&limit=${limit}${searchQuery ? `&search=${searchQuery}` : ""}${hospitalFilter ? `&hospitalId=${hospitalFilter}` : ""}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch diagnoses")
      }

      const data = await response.json()
      setDiagnoses(data.diagnoses)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error("Error fetching diagnoses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnoses()
  }, [page, limit, hospitalFilter])

  const handleSearch = () => {
    setPage(1) // Reset to first page when searching
    fetchDiagnoses()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleDeleteDiagnosis = async () => {
    if (!selectedDiagnosis) return

    setIsDeleting(true)
    try {
      const response = await apiRequest("/api/admin/diagnoses", {
        method: "DELETE",
        body: { diagnosisId: selectedDiagnosis.id },
      })

      if (!response.ok) {
        throw new Error("Failed to delete diagnosis")
      }

      // Remove the deleted diagnosis from the list
      setDiagnoses(diagnoses.filter((d) => d.id !== selectedDiagnosis.id))
      setTotal(total - 1)
      setTotalPages(Math.ceil((total - 1) / limit))

      // Close the dialog
      setIsDeleteDialogOpen(false)
      setSelectedDiagnosis(null)
    } catch (error) {
      console.error("Error deleting diagnosis:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleViewDiagnosis = (diagnosis: Diagnosis) => {
    router.push(`/admin/diagnoses/${diagnosis.id}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search diagnoses..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={hospitalFilter || ""} onValueChange={(value) => setHospitalFilter(value || null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by hospital" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hospitals</SelectItem>
              {hospitals.map((hospital) => (
                <SelectItem key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      ) : diagnoses.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No diagnoses found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || hospitalFilter
              ? "Try adjusting your search or filter criteria."
              : "There are no diagnoses in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnoses.map((diagnosis) => (
                  <TableRow key={diagnosis.id}>
                    <TableCell className="font-mono text-xs">{diagnosis.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{diagnosis.title}</TableCell>
                    <TableCell>{diagnosis.patient_id}</TableCell>
                    <TableCell>{diagnosis.hospitals?.name}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleViewDiagnosis(diagnosis)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedDiagnosis(diagnosis)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} diagnoses
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this diagnosis?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the diagnosis and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDiagnosis}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diagnosis Details Dialog */}
      <Dialog open={!!selectedDiagnosis && !isDeleteDialogOpen} onOpenChange={() => setSelectedDiagnosis(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDiagnosis?.title}</DialogTitle>
            <DialogDescription>Diagnosis ID: {selectedDiagnosis?.id}</DialogDescription>
          </DialogHeader>
          {selectedDiagnosis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Patient ID</p>
                  <p className="text-sm">{selectedDiagnosis.patient_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Hospital</p>
                  <p className="text-sm">{selectedDiagnosis.hospitals?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Doctor</p>
                  <p className="text-sm">{selectedDiagnosis.users?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{format(new Date(selectedDiagnosis.created_at), "PPP")}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedDiagnosis(null)}>
                  Close
                </Button>
                <Button onClick={() => handleViewDiagnosis(selectedDiagnosis)}>View Full Details</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
