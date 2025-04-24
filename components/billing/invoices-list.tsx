"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Download, Eye, Mail, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateInvoiceStatus, sendInvoiceEmail } from "@/services/billing-service"
import InvoicePreview from "@/components/billing/invoice-preview"

interface InvoicesListProps {
  invoices: any[]
  formatCurrency: (amount: number) => string
  isAdmin: boolean
}

export default function InvoicesList({ invoices, formatCurrency, isAdmin }: InvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
  }

  const handleCloseInvoice = () => {
    setSelectedInvoice(null)
  }

  const handleDownloadInvoice = (invoice: any) => {
    // In a real application, this would generate a PDF and download it
    alert(`Downloading invoice ${invoice.invoice_number}`)
  }

  const handleSendInvoice = async (invoice: any) => {
    setIsLoading(true)
    try {
      await sendInvoiceEmail(invoice.id)
      // Refresh the page to update the invoice status
      window.location.reload()
    } catch (error) {
      console.error("Error sending invoice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsPaid = async (invoice: any) => {
    setIsLoading(true)
    try {
      await updateInvoiceStatus(invoice.id, "paid")
      // Refresh the page to update the invoice status
      window.location.reload()
    } catch (error) {
      console.error("Error updating invoice status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        )
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" /> Paid
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <AlertCircle className="mr-1 h-3 w-3" /> Overdue
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Mail className="mr-1 h-3 w-3" /> Sent
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{format(new Date(invoice.date_generated), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    {format(new Date(invoice.start_date), "MMM d")} -{" "}
                    {format(new Date(invoice.end_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {isAdmin && invoice.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendInvoice(invoice)}
                          disabled={isLoading}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (invoice.status === "pending" || invoice.status === "sent") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsPaid(invoice)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={handleCloseInvoice}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
            <DialogDescription>
              Generated on {selectedInvoice && format(new Date(selectedInvoice.date_generated), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && <InvoicePreview invoice={selectedInvoice} formatCurrency={formatCurrency} />}

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCloseInvoice}>
              Close
            </Button>
            <Button onClick={() => handleDownloadInvoice(selectedInvoice)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
