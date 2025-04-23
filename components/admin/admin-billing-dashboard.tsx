"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon, FileText, CreditCard, Building, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AdminBillingChart from "@/components/admin/admin-billing-chart"
import AdminHospitalBillingTable from "@/components/admin/admin-hospital-billing-table"
import InvoicesList from "@/components/billing/invoices-list"
import { getBillingData, generateInvoice } from "@/services/billing-service"

interface AdminBillingDashboardProps {
  initialBillingData: any
  hospitals: { id: string; name: string; code: string }[]
  initialInvoices: any[]
}

export default function AdminBillingDashboard({
  initialBillingData,
  hospitals,
  initialInvoices,
}: AdminBillingDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [billingPeriod, setBillingPeriod] = useState("last-30-days")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null)
  const [billingData, setBillingData] = useState(initialBillingData)
  const [invoices, setInvoices] = useState(initialInvoices)
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const [invoiceHospital, setInvoiceHospital] = useState("")
  const [invoiceStartDate, setInvoiceStartDate] = useState<Date | undefined>(subMonths(new Date(), 1))
  const [invoiceEndDate, setInvoiceEndDate] = useState<Date | undefined>(new Date())
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null)

  // Function to fetch billing data based on selected period and hospital
  const fetchBillingData = async () => {
    setIsLoading(true)
    try {
      let startDate, endDate

      switch (billingPeriod) {
        case "current-month":
          const currentMonth = new Date()
          startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd")
          endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd")
          break
        case "previous-month":
          const lastMonth = subMonths(new Date(), 1)
          startDate = format(startOfMonth(lastMonth), "yyyy-MM-dd")
          endDate = format(endOfMonth(lastMonth), "yyyy-MM-dd")
          break
        case "last-30-days":
          startDate = format(subMonths(new Date(), 1), "yyyy-MM-dd")
          endDate = format(new Date(), "yyyy-MM-dd")
          break
        case "custom-range":
          startDate = format(dateRange.from, "yyyy-MM-dd")
          endDate = format(dateRange.to, "yyyy-MM-dd")
          break
        default:
          startDate = format(subMonths(new Date(), 1), "yyyy-MM-dd")
          endDate = format(new Date(), "yyyy-MM-dd")
      }

      const { billingData: newData } = await getBillingData({
        hospitalId: selectedHospital || undefined,
        startDate,
        endDate,
      })

      setBillingData(newData)
    } catch (error) {
      console.error("Error fetching billing data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when period or hospital changes
  useEffect(() => {
    if (billingPeriod !== "custom-range") {
      fetchBillingData()
    }
  }, [billingPeriod, selectedHospital])

  // Fetch data when custom date range changes
  useEffect(() => {
    if (billingPeriod === "custom-range" && dateRange.from && dateRange.to) {
      fetchBillingData()
    }
  }, [dateRange, billingPeriod, selectedHospital])

  // Handle invoice generation
  const handleGenerateInvoice = async () => {
    if (!invoiceHospital || !invoiceStartDate || !invoiceEndDate) {
      setInvoiceError("Please select a hospital and date range")
      return
    }

    setIsGeneratingInvoice(true)
    setInvoiceError(null)
    setInvoiceSuccess(null)

    try {
      const startDate = format(invoiceStartDate, "yyyy-MM-dd")
      const endDate = format(invoiceEndDate, "yyyy-MM-dd")

      const { invoice, error } = await generateInvoice(invoiceHospital, startDate, endDate)

      if (error) {
        setInvoiceError(error)
      } else {
        setInvoiceSuccess(`Invoice ${invoice.invoice_number} generated successfully`)
        // Reset form
        setInvoiceHospital("")
        setInvoiceStartDate(subMonths(new Date(), 1))
        setInvoiceEndDate(new Date())
        setShowInvoiceForm(false)

        // Refresh data
        fetchBillingData()

        // Refresh page to show new invoice
        window.location.reload()
      }
    } catch (error) {
      console.error("Error generating invoice:", error)
      setInvoiceError("An unexpected error occurred")
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Extract overall stats
  const overallStats = billingData?.overall || {
    totalAmount: 0,
    diagnosisCounts: {},
    diagnosisCosts: {},
    totalDiagnoses: 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Billing Overview</h2>
          <p className="text-sm text-muted-foreground">View and manage billing information for all hospitals</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedHospital || ""} onValueChange={(value) => setSelectedHospital(value || null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Hospitals" />
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

          <Select value={billingPeriod} onValueChange={setBillingPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="previous-month">Previous Month</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="custom-range">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {billingPeriod === "custom-range" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange(range as { from: Date; to: Date })
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billing Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              For{" "}
              {billingPeriod === "current-month"
                ? "current month"
                : billingPeriod === "previous-month"
                  ? "previous month"
                  : billingPeriod === "last-30-days"
                    ? "last 30 days"
                    : "selected period"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Diagnoses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalDiagnoses}</div>
            <p className="text-xs text-muted-foreground">Across all hospitals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.hospitals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">With billing activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Per Hospital</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billingData?.hospitals?.length > 0
                ? formatCurrency(overallStats.totalAmount / billingData.hospitals.length)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Average billing amount</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="generate">Generate Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Billing Breakdown</CardTitle>
                <CardDescription>Distribution of costs by diagnosis type</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <AdminBillingChart data={overallStats} />
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Diagnosis Type Summary</CardTitle>
                <CardDescription>Count and cost by diagnosis type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(overallStats.diagnosisCounts).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{type}</p>
                        <p className="text-sm text-muted-foreground">{String(count)} diagnoses</p>
                      </div>
                      <div className="font-medium">{formatCurrency(overallStats.diagnosisCosts[type] || 0)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hospitals">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Billing Summary</CardTitle>
              <CardDescription>Billing information for each hospital</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminHospitalBillingTable hospitals={billingData?.hospitals || []} formatCurrency={formatCurrency} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View and manage all invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicesList invoices={invoices} formatCurrency={formatCurrency} isAdmin={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Invoice</CardTitle>
              <CardDescription>Create a new invoice for a hospital</CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceSuccess && (
                <Alert className="mb-4 bg-green-50 text-green-800">
                  <AlertDescription>{invoiceSuccess}</AlertDescription>
                </Alert>
              )}

              {invoiceError && (
                <Alert className="mb-4 bg-red-50 text-red-800">
                  <AlertDescription>{invoiceError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital</Label>
                    <Select value={invoiceHospital} onValueChange={setInvoiceHospital}>
                      <SelectTrigger id="hospital">
                        <SelectValue placeholder="Select a hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} ({hospital.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Period</Label>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !invoiceStartDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceStartDate ? format(invoiceStartDate, "PPP") : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={invoiceStartDate}
                            onSelect={setInvoiceStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !invoiceEndDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {invoiceEndDate ? format(invoiceEndDate, "PPP") : "End date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={invoiceEndDate} onSelect={setInvoiceEndDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateInvoice}
                  disabled={isGeneratingInvoice || !invoiceHospital || !invoiceStartDate || !invoiceEndDate}
                >
                  {isGeneratingInvoice ? "Generating..." : "Generate Invoice"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
