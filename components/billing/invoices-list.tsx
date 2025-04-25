"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Download, Eye, Mail, CheckCircle, AlertCircle, Clock, Send } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateInvoiceStatus, sendInvoiceEmail } from "@/services/billing-service"
import InvoicePreview from "@/components/billing/invoice-preview"
import { formatCurrency } from "@/lib/utils/billing-utils"
import { generateInvoicePDF } from "@/lib/utils/pdf-utils"
import { toast } from "@/components/ui/use-toast"

interface InvoicesListProps {
  invoices: any[]
  formatCurrency: (amount: number) => string
  isAdmin: boolean
}

export default function InvoicesList({ invoices, isAdmin }: InvoicesListProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actionType, setActionType] = useState<"send" | "markPaid" | null>(null)

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
  }

  const handleCloseInvoice = () => {
    setSelectedInvoice(null)
  }

  const handleDownloadInvoice = async (invoice: any) => {
    try {
      setIsLoading(true)
      // Generate and download the PDF
      await generateInvoicePDF(invoice)
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendInvoice = async (invoice: any) => {
    setIsLoading(true)
    setActionType("send")
    try {
      const { success, error } = await sendInvoiceEmail(invoice.id)
      if (error) {
        throw new Error(error)
      }
      toast({
        title: "Success",
        description: "Invoice sent to hospital successfully",
      })
      // Refresh the page to update the invoice status
      window.location.reload()
    } catch (error) {
      console.error("Error sending invoice:", error)
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  const handleMarkAsPaid = async (invoice: any) => {
    setIsLoading(true)
    setActionType("markPaid")
    try {
      const { invoice: updatedInvoice, error } = await updateInvoiceStatus(invoice.id, "paid")
      if (error) {
        throw new Error(error)
      }
      toast({
        title: "Success",
        description: "Invoice marked as paid",
      })
      // Refresh the page to update the invoice status
      window.location.reload()
    } catch (error) {
      console.error("Error updating invoice status:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setActionType(null)
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadInvoice(invoice)}
                        disabled={isLoading}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isAdmin && invoice.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendInvoice(invoice)}
                          disabled={isLoading && actionType === "send"}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (invoice.status === "pending" || invoice.status === "sent") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsPaid(invoice)}
                          disabled={isLoading && actionType === "markPaid"}
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
            <DialogDescription>
              Generated on {selectedInvoice && format(new Date(selectedInvoice.date_generated), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
            {selectedInvoice && <InvoicePreview invoice={selectedInvoice} formatCurrency={formatCurrency} />}
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCloseInvoice}>
              Close
            </Button>
            {selectedInvoice && (
              <Button onClick={() => handleDownloadInvoice(selectedInvoice)} disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" />
                {isLoading ? "Downloading..." : "Download PDF"}
              </Button>
            )}
            {isAdmin && selectedInvoice && selectedInvoice.status === "pending" && (
              <Button
                onClick={() => handleSendInvoice(selectedInvoice)}
                disabled={isLoading && actionType === "send"}
                variant="default"
              >
                <Send className="mr-2 h-4 w-4" />
                {isLoading && actionType === "send" ? "Sending..." : "Send to Hospital"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
