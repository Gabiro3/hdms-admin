"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Eye, Download } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface AdminHospitalBillingTableProps {
  hospitals: any[]
  formatCurrency: (amount: number) => string
}

export default function AdminHospitalBillingTable({ hospitals, formatCurrency }: AdminHospitalBillingTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null)

  // Filter hospitals based on search
  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.hospitalCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate total amount for percentage calculation
  const totalAmount = hospitals.reduce((sum, hospital) => sum + hospital.totalAmount, 0)

  // Handle view hospital details
  const handleViewHospital = (hospital: any) => {
    setSelectedHospital(hospital)
  }

  // Handle close hospital details
  const handleCloseHospital = () => {
    setSelectedHospital(null)
  }

  // Handle download hospital report
  const handleDownloadReport = (hospital: any) => {
    // In a real application, this would generate a PDF report
    alert(`Downloading report for ${hospital.hospitalName}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search hospitals..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hospital</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Diagnoses</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHospitals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No hospitals found.
                </TableCell>
              </TableRow>
            ) : (
              filteredHospitals.map((hospital) => (
                <TableRow key={hospital.hospitalId}>
                  <TableCell className="font-medium">{hospital.hospitalName}</TableCell>
                  <TableCell>{hospital.hospitalCode}</TableCell>
                  <TableCell>{hospital.diagnoses.length}</TableCell>
                  <TableCell>{formatCurrency(hospital.totalAmount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={totalAmount > 0 ? (hospital.totalAmount / totalAmount) * 100 : 0}
                        className="h-2 w-full"
                      />
                      <span className="text-xs w-12 text-right">
                        {totalAmount > 0 ? ((hospital.totalAmount / totalAmount) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewHospital(hospital)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadReport(hospital)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Hospital Details Dialog */}
      <Dialog open={!!selectedHospital} onOpenChange={handleCloseHospital}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedHospital?.hospitalName}</DialogTitle>
            <DialogDescription>Hospital Code: {selectedHospital?.hospitalCode}</DialogDescription>
          </DialogHeader>

          {selectedHospital && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedHospital.totalAmount)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Diagnoses</p>
                  <p className="text-2xl font-bold">{selectedHospital.diagnoses.length}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Average Cost</p>
                  <p className="text-2xl font-bold">
                    {selectedHospital.diagnoses.length > 0
                      ? formatCurrency(selectedHospital.totalAmount / selectedHospital.diagnoses.length)
                      : formatCurrency(0)}
                  </p>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Diagnosis Type</TableHead>
                      <TableHead className="text-center">Count</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(selectedHospital.diagnosisCounts).map(([type, count]) => (
                      <TableRow key={type}>
                        <TableCell className="font-medium">{type}</TableCell>
                        <TableCell className="text-center">{count as number}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(selectedHospital.diagnosisCosts[type] || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
