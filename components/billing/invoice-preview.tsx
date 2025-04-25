"use client"

import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils/billing-utils"

interface InvoicePreviewProps {
  invoice: any
  formatCurrency: (amount: number) => string
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const details = invoice.details || {}
  const hospitalName = details.hospitalName || invoice.hospitals?.name || "Unknown Hospital"
  const hospitalAddress = details.hospitalAddress || invoice.hospitals?.address || ""

  // Get diagnoses from details or calculate from period
  const diagnoses = details.diagnoses || []

  // Group diagnoses by type
  const diagnosisByType: Record<string, { count: number; cost: number }> = {}

  diagnoses.forEach((diagnosis: any) => {
    const type = diagnosis.diagnosisType || "Other"
    if (!diagnosisByType[type]) {
      diagnosisByType[type] = { count: 0, cost: 0 }
    }
    diagnosisByType[type].count += 1
    diagnosisByType[type].cost += diagnosis.cost || 0
  })

  return (
    <div className="space-y-8 p-4 bg-white rounded-lg" id="invoice-content">
      {/* Invoice Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-blue-600 text-white p-3 rounded-lg mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-gray-500">{invoice.invoice_number}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">Healthlink Rwanda HDMS</p>
          <p className="text-sm text-gray-500">KN 5 Rd, Kigali</p>
          <p className="text-sm text-gray-500">Rwanda</p>
          <p className="text-sm text-gray-500">info@healthlinkrwanda.org</p>
        </div>
      </div>

      <Separator />

      {/* Bill To */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-medium text-gray-500">Bill To:</p>
          <p className="font-bold">{hospitalName}</p>
          <p className="text-sm text-gray-500">{hospitalAddress}</p>
        </div>
        <div className="text-right">
          <div className="space-y-1">
            <div className="flex justify-between">
              <p className="text-sm font-medium text-gray-500">Invoice Date:</p>
              <p className="text-sm">{format(new Date(invoice.date_generated), "MMMM d, yyyy")}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm font-medium text-gray-500">Billing Period:</p>
              <p className="text-sm">
                {format(new Date(invoice.start_date), "MMMM d")} - {format(new Date(invoice.end_date), "MMMM d, yyyy")}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm font-medium text-gray-500">Status:</p>
              <p className="text-sm font-medium text-blue-600">{invoice.status.toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Summary */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diagnosis Type</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(diagnosisByType).map(([type, data]) => (
                <TableRow key={type}>
                  <TableCell className="font-medium">{type}</TableCell>
                  <TableCell className="text-center">{data.count}</TableCell>
                  <TableCell className="text-center">{formatCurrency(data.cost / data.count)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Total */}
      <div className="flex justify-end">
        <div className="w-80 space-y-2">
          <div className="flex justify-between">
            <p className="font-medium">Subtotal:</p>
            <p>{formatCurrency(invoice.total_amount)}</p>
          </div>
          <div className="flex justify-between">
            <p className="font-medium">Tax (0%):</p>
            <p>{formatCurrency(0)}</p>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <p>Total:</p>
            <p>{formatCurrency(invoice.total_amount)}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="font-medium">Notes:</p>
        <p className="text-sm text-gray-500">
          Payment is due within 30 days of invoice date. Please make payment to Healthlink Rwanda HDMS. Thank you for
          your business.
        </p>
      </div>
    </div>
  )
}
