"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Filter,
  MoreHorizontal,
  UserX,
  UserCheck,
  KeyRound,
  Shield,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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
import { Card } from "@/components/ui/card"

interface User {
  id: string
  full_name: string
  email: string
  is_admin: boolean
  is_verified: boolean
  is_disabled: boolean
  last_login: string | null
  hospital_id: string
  created_at: string
  hospitals: {
    name: string
    code: string
  }
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<
    "disable" | "enable" | "resetPassword" | "makeAdmin" | "removeAdmin" | null
  >(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [hospitalFilter, setHospitalFilter] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<{ id: string; name: string }[]>([])
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
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

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let url = `/api/admin/users?page=${page}&limit=${limit}`

      if (searchQuery) {
        url += `&search=${searchQuery}`
      }

      if (hospitalFilter) {
        url += `&hospitalId=${hospitalFilter}`
      }

      if (statusFilter) {
        if (statusFilter === "active") {
          url += "&isDisabled=false"
        } else if (statusFilter === "disabled") {
          url += "&isDisabled=true"
        } else if (statusFilter === "admin") {
          url += "&isAdmin=true"
        } else if (statusFilter === "verified") {
          url += "&isVerified=true"
        } else if (statusFilter === "unverified") {
          url += "&isVerified=false"
        }
      }

      const response = await apiRequest(url)
      console.log(response)

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, limit, hospitalFilter, statusFilter])

  const handleSearch = () => {
    setPage(1) // Reset to first page when searching
    fetchUsers()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleUserAction = async () => {
    if (!selectedUser || !actionType) return

    setIsProcessing(true)
    try {
      let response

      switch (actionType) {
        case "disable":
          response = await apiRequest(`/api/admin/users/${selectedUser.id}`, {
            method: "PATCH",
            body: { operation: "disable" },
          })
          break
        case "enable":
          response = await apiRequest(`/api/admin/users/${selectedUser.id}`, {
            method: "PATCH",
            body: { operation: "enable" },
          })
          break
        case "resetPassword":
          response = await apiRequest(`/api/admin/users/${selectedUser.id}`, {
            method: "PATCH",
            body: { operation: "resetPassword" },
          })

          if (response.ok) {
            const data = await response.json()
            setTemporaryPassword(data.temporaryPassword)
          }
          break
        case "makeAdmin":
          response = await apiRequest(`/api/admin/users/${selectedUser.id}`, {
            method: "PATCH",
            body: { isAdmin: true },
          })
          break
        case "removeAdmin":
          response = await apiRequest(`/api/admin/users/${selectedUser.id}`, {
            method: "PATCH",
            body: { isAdmin: false },
          })
          break
        default:
          throw new Error("Invalid action type")
      }

      if (!response.ok) {
        throw new Error(`Failed to ${actionType} user`)
      }

      // Update the user in the list
      if (actionType !== "resetPassword") {
        setUsers(
          users.map((u) => {
            if (u.id === selectedUser.id) {
              return {
                ...u,
                is_disabled: actionType === "disable" ? true : actionType === "enable" ? false : u.is_disabled,
                is_admin: actionType === "makeAdmin" ? true : actionType === "removeAdmin" ? false : u.is_admin,
              }
            }
            return u
          }),
        )
      }

      if (actionType !== "resetPassword") {
        // Close the dialog
        setIsActionDialogOpen(false)
        setActionType(null)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error(`Error performing ${actionType} action:`, error)
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

  const getStatusBadge = (user: User) => {
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
              placeholder="Search users..."
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
          <Select value={hospitalFilter ?? undefined} onValueChange={(value) => setHospitalFilter(value || null)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Filter by hospital" />
  </SelectTrigger>
  <SelectContent>
    {/* Use null for "All Hospitals" instead of an empty string */}
    <SelectItem value="all">All Hospitals</SelectItem>
    {hospitals.map((hospital) => (
      <SelectItem key={hospital.id} value={hospital.id}>
        {hospital.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

<Select value={statusFilter ?? undefined} onValueChange={(value) => setStatusFilter(value || null)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Filter by status" />
  </SelectTrigger>
  <SelectContent>
    {/* Use null for "All Users" instead of an empty string */}
    <SelectItem value="active">All Users</SelectItem>
    <SelectItem value="active">Active</SelectItem>
    <SelectItem value="disabled">Disabled</SelectItem>
    <SelectItem value="admin">Administrators</SelectItem>
    <SelectItem value="verified">Verified</SelectItem>
    <SelectItem value="unverified">Unverified</SelectItem>
  </SelectContent>
</Select>

        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No users found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery || hospitalFilter || statusFilter
              ? "Try adjusting your search or filter criteria."
              : "There are no users in the system yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                    <TableCell>{user.hospitals?.name}</TableCell>
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setActionType("resetPassword")
                              setIsActionDialogOpen(true)
                            }}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>

                          {user.is_disabled ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("enable")
                                setIsActionDialogOpen(true)
                              }}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Enable User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("disable")
                                setIsActionDialogOpen(true)
                              }}
                              className="text-amber-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Disable User
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {user.is_admin ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("removeAdmin")
                                setIsActionDialogOpen(true)
                              }}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setActionType("makeAdmin")
                                setIsActionDialogOpen(true)
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
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
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
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

      {/* Action Confirmation Dialog */}
      <AlertDialog open={isActionDialogOpen && actionType !== "resetPassword"} onOpenChange={setIsActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "disable" && "Disable User Account"}
              {actionType === "enable" && "Enable User Account"}
              {actionType === "makeAdmin" && "Grant Administrator Privileges"}
              {actionType === "removeAdmin" && "Remove Administrator Privileges"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "disable" &&
                "This will prevent the user from accessing the system. They will not be able to log in until their account is enabled again."}
              {actionType === "enable" &&
                "This will restore the user's access to the system. They will be able to log in again."}
              {actionType === "makeAdmin" &&
                "This will grant administrator privileges to this user. They will have access to all administrative functions."}
              {actionType === "removeAdmin" &&
                "This will remove administrator privileges from this user. They will no longer have access to administrative functions."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUserAction}
              disabled={isProcessing}
              className={actionType === "disable" ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {isProcessing ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={actionType === "resetPassword"}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null)
            setSelectedUser(null)
            setTemporaryPassword(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              {!temporaryPassword
                ? "This will generate a new temporary password for the user. They will need to change it upon their next login."
                : "Password has been reset successfully. Make sure to share this temporary password with the user securely."}
            </DialogDescription>
          </DialogHeader>

          {!temporaryPassword ? (
            <div className="space-y-4">
              <p className="text-sm">You are about to reset the password for:</p>
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser ? getInitials(selectedUser.full_name) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionType(null)
                    setSelectedUser(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUserAction} disabled={isProcessing}>
                  {isProcessing ? "Generating..." : "Reset Password"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-amber-50 border-amber-200">
                <div className="p-4">
                  <p className="font-medium text-amber-800 mb-2">Temporary Password</p>
                  <p className="font-mono text-lg bg-white p-2 rounded border border-amber-200 text-center">
                    {temporaryPassword}
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    This password will only be shown once. Make sure to copy it now.
                  </p>
                </div>
              </Card>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setActionType(null)
                    setSelectedUser(null)
                    setTemporaryPassword(null)
                    setIsActionDialogOpen(false)
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
