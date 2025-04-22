"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MoreHorizontal, Edit, Trash2, Users, ChevronLeft, ChevronRight, Building, Plus } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

interface Hospital {
  id: string
  name: string
  code: string
  address: string
  created_at: string
  updated_at: string
}

interface HospitalUser {
  id: string
  full_name: string
  email: string
  is_admin: boolean
  is_verified: boolean
  is_disabled: boolean
  last_login: string | null
}

export default function AdminHospitalsList() {
  const router = useRouter()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false)
  const [isRevokeAccessDialogOpen, setIsRevokeAccessDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hospitalUsers, setHospitalUsers] = useState<HospitalUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const supabase = createClientComponentClient()

  const fetchHospitals = async () => {
    setLoading(true)
    try {
      const response = await apiRequest(
        `/api/admin/hospitals?page=${page}&limit=${limit}${searchQuery ? `&search=${searchQuery}` : ""}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch hospitals")
      }

      const data = await response.json()
      setHospitals(data.hospitals)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error("Error fetching hospitals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [page, limit])

  const handleSearch = () => {
    setPage(1) // Reset to first page when searching
    fetchHospitals()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const fetchHospitalUsers = async (hospitalId: string) => {
    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, is_admin, is_verified, is_disabled, last_login")
        .eq("hospital_id", hospitalId)
        .order("full_name")
      if (error) throw error

      setHospitalUsers(data || [])
    } catch (error) {
      console.error("Error fetching hospital users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleViewUsers = async (hospital: Hospital) => {
    setSelectedHospital(hospital)
    setIsUsersDialogOpen(true)
    await fetchHospitalUsers(hospital.id)
  }

  const handleDeleteHospital = async () => {
    if (!selectedHospital) return

    setIsProcessing(true)
    try {
      const response = await apiRequest("/api/admin/hospitals", {
        method: "DELETE",
        body: { hospitalId: selectedHospital.id },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete hospital")
      }

      // Remove the deleted hospital from the list
      setHospitals(hospitals.filter((h) => h.id !== selectedHospital.id))
      setTotal(total - 1)
      setTotalPages(Math.ceil((total - 1) / limit))

      // Close the dialog
      setIsDeleteDialogOpen(false)
      setSelectedHospital(null)
    } catch (error) {
      console.error("Error deleting hospital:", error)
      alert(error instanceof Error ? error.message : "Failed to delete hospital")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRevokeAllAccess = async () => {
    if (!selectedHospital) return

    setIsProcessing(true)
    try {
      // For each user in the hospital, disable their account
      const promises = hospitalUsers.map(async (user) => {
        const response = await apiRequest(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          body: { operation: "disable" },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to disable user ${user.full_name}`)
        }
      })

      await Promise.all(promises)

      // Refresh the user list
      await fetchHospitalUsers(selectedHospital.id)

      // Close the dialog
      setIsRevokeAccessDialogOpen(false)
    } catch (error) {
      console.error("Error revoking access:", error)
      alert(error instanceof Error ? error.message : "Failed to revoke access")
    } finally {
      setIsProcessing(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusBadge = (user: HospitalUser) => {
    if (user.is_disabled) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700">
          Disabled
        </Badge>
      )
    }
    if (!user.is_verified) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          Unverified
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        Active
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search hospitals..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No hospitals found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search criteria." : "There are no hospitals in the system yet."}
          </p>
          <Link href="/admin/hospitals/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Hospital
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell className="font-medium">{hospital.name}</TableCell>
                    <TableCell>{hospital.code}</TableCell>
                    <TableCell>{hospital.address}</TableCell>
                    <TableCell>{format(new Date(hospital.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(hospital.updated_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/hospitals/edit/${hospital.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewUsers(hospital)}>
                            <Users className="mr-2 h-4 w-4" />
                            View Users
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedHospital(hospital)
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
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} hospitals
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
            <AlertDialogTitle>Are you sure you want to delete this hospital?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the hospital and all associated data.
              <br />
              <br />
              <strong>Note:</strong> You cannot delete a hospital that has associated users or diagnoses. You must first
              reassign or delete those users and diagnoses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHospital}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hospital Users Dialog */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Users for {selectedHospital?.name}</DialogTitle>
            <DialogDescription>
              Manage users associated with this hospital. You can view user details or revoke access for all users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total users: <strong>{hospitalUsers.length}</strong>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsRevokeAccessDialogOpen(true)
                }}
                disabled={hospitalUsers.length === 0}
              >
                Revoke All Access
              </Button>
            </div>

            {loadingUsers ? (
              <div className="h-60 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
              </div>
            ) : hospitalUsers.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-medium">No users found</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  This hospital doesn't have any associated users yet.
                </p>
              </div>
            ) : (
              <div className="rounded-md border bg-white max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hospitalUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getStatusBadge(user)}</TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              Administrator
                            </Badge>
                          ) : (
                            "User"
                          )}
                        </TableCell>
                        <TableCell>
                          {user.last_login ? format(new Date(user.last_login), "MMM d, yyyy") : "Never"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUsersDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => router.push("/admin/users")}>Manage All Users</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={isRevokeAccessDialogOpen} onOpenChange={setIsRevokeAccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access for all users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable access for all {hospitalUsers.length} users associated with{" "}
              <strong>{selectedHospital?.name}</strong>. Users will not be able to log in until their accounts are
              re-enabled.
              <br />
              <br />
              This action can be reversed by re-enabling individual user accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllAccess}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Processing..." : "Revoke All Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
