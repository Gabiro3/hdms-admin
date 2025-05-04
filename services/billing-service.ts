"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { getDiagnosisCosts } from "@/lib/utils/billing-utils"

type BillingPeriod = "current-month" | "previous-month" | "last-3-months" | "last-6-months" | "custom"

interface BillingFilter {
  hospitalId?: string
  startDate?: string
  endDate?: string
  period?: BillingPeriod
  status?: string
}

/**
 * Get billing data for a specific hospital or all hospitals
 */
export async function getBillingData(filters: BillingFilter = {}) {
  try {
    const supabase = createServerSupabaseClient()

    // Set date range based on period
    let { startDate, endDate } = filters

    if (filters.period && !startDate && !endDate) {
      const today = new Date()

      switch (filters.period) {
        case "current-month":
          startDate = format(startOfMonth(today), "yyyy-MM-dd")
          endDate = format(endOfMonth(today), "yyyy-MM-dd")
          break
        case "previous-month":
          const lastMonth = subMonths(today, 1)
          startDate = format(startOfMonth(lastMonth), "yyyy-MM-dd")
          endDate = format(endOfMonth(lastMonth), "yyyy-MM-dd")
          break
        case "last-3-months":
          startDate = format(subMonths(today, 3), "yyyy-MM-dd")
          endDate = format(today, "yyyy-MM-dd")
          break
        case "last-6-months":
          startDate = format(subMonths(today, 6), "yyyy-MM-dd")
          endDate = format(today, "yyyy-MM-dd")
          break
      }
    }

    // Build the query
    let query = supabase.from("diagnoses").select(`
     *,
     users (id, full_name, email),
     hospitals (id, name, code, address)
   `)

    // Apply filters
    if (filters.hospitalId) {
      query = query.eq("hospital_id", filters.hospitalId)
    }

    if (startDate) {
      query = query.gte("created_at", startDate)
    }

    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    if (filters.status) {
      query = query.eq("billing_status", filters.status)
    }

    // Execute the query
    const { data: diagnoses, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    // Process the data to calculate costs
    const processedData = await processBillingData(diagnoses)

    return {
      billingData: processedData,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching billing data:", error)
    return {
      billingData: null,
      error: "Failed to fetch billing data",
    }
  }
}

/**
 * Process raw diagnosis data into billing information
 */
async function processBillingData(diagnoses: any[]) {
  // Get the diagnosis costs
  const DIAGNOSIS_COSTS = await getDiagnosisCosts()

  // Group diagnoses by hospital
  const hospitalGroups: Record<string, any> = {}

  // Track overall totals
  const overallStats = {
    totalAmount: 0,
    diagnosisCounts: {} as Record<string, number>,
    diagnosisCosts: {} as Record<string, number>,
    totalDiagnoses: diagnoses.length,
  }

  diagnoses.forEach((diagnosis) => {
    const hospitalId = diagnosis.hospital_id
    const hospitalName = diagnosis.hospitals?.name || "Unknown Hospital"

    // Get the diagnosis type from metadata or title
    let diagnosisType = diagnosis.patient_metadata?.scan_type || "Other"

    // If not available in metadata, try to extract from title
    if (diagnosisType === "Other" && diagnosis.title) {
      const match = diagnosis.title.match(/(X-Ray|CT Scan|MRI|Mammography|Ultrasound)/i)
      if (match) {
        diagnosisType = match[0]
      }
    }

    // Get the cost for this diagnosis type
    const cost = DIAGNOSIS_COSTS[diagnosisType as keyof typeof DIAGNOSIS_COSTS] || DIAGNOSIS_COSTS.Other

    // Initialize hospital group if it doesn't exist
    if (!hospitalGroups[hospitalId]) {
      hospitalGroups[hospitalId] = {
        hospitalId,
        hospitalName: hospitalName,
        hospitalCode: diagnosis.hospitals?.code || "Unknown",
        hospitalAddress: diagnosis.hospitals?.address || "",
        totalAmount: 0,
        diagnosisCounts: {},
        diagnosisCosts: {},
        diagnoses: [],
      }
    }

    // Update hospital group data
    const group = hospitalGroups[hospitalId]
    group.totalAmount += Number(cost)
    group.diagnosisCounts[diagnosisType] = (group.diagnosisCounts[diagnosisType] || 0) + 1
    group.diagnosisCosts[diagnosisType] = (group.diagnosisCosts[diagnosisType] || 0) + Number(cost)
    group.diagnoses.push({
      ...diagnosis,
      diagnosisType,
      cost,
    })

    // Update overall stats
    overallStats.totalAmount += Number(cost)
    overallStats.diagnosisCounts[diagnosisType] = (overallStats.diagnosisCounts[diagnosisType] || 0) + 1
    overallStats.diagnosisCosts[diagnosisType] = (overallStats.diagnosisCosts[diagnosisType] || 0) + Number(cost)
  })

  return {
    hospitals: Object.values(hospitalGroups),
    overall: overallStats,
  }
}

/**
 * Generate an invoice for a hospital
 */
export async function generateInvoice(hospitalId: string, startDate: string, endDate: string) {
  try {
    const { billingData, error } = await getBillingData({
      hospitalId,
      startDate,
      endDate,
    })

    if (error) throw error

    if (!billingData || billingData.hospitals.length === 0) {
      return {
        invoice: null,
        error: "No billing data found for this hospital in the specified date range",
      }
    }

    const hospitalData = billingData.hospitals[0]

    // Generate invoice number
    const invoiceNumber = `INV-${hospitalData.hospitalCode}-${format(new Date(), "yyyyMMdd")}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`

    // Create invoice object
    const invoice = {
      invoiceNumber,
      hospitalId,
      hospitalName: hospitalData.hospitalName,
      hospitalCode: hospitalData.hospitalCode,
      hospitalAddress: hospitalData.hospitalAddress,
      dateGenerated: new Date().toISOString(),
      startDate,
      endDate,
      totalAmount: hospitalData.totalAmount,
      diagnosisCounts: hospitalData.diagnosisCounts,
      diagnosisCosts: hospitalData.diagnosisCosts,
      diagnoses: hospitalData.diagnoses,
      status: "pending", // pending, paid, overdue
    }

    // Save the invoice to the database
    const supabase = createServerSupabaseClient()
    const { data, error: saveError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        hospital_id: hospitalId,
        start_date: startDate,
        end_date: endDate,
        total_amount: hospitalData.totalAmount,
        details: invoice,
        status: "pending",
      })
      .select()
      .single()

    if (saveError) throw saveError

    // Update the billing status of the diagnoses
    const { error: updateError } = await supabase
      .from("diagnoses")
      .update({ billing_status: "invoiced" })
      .eq("hospital_id", hospitalId)
      .gte("created_at", startDate)
      .lte("created_at", endDate)

    if (updateError) throw updateError

    revalidatePath("/admin/billing")
    return { invoice: data, error: null }
  } catch (error) {
    console.error("Error generating invoice:", error)
    return {
      invoice: null,
      error: "Failed to generate invoice",
    }
  }
}

/**
 * Get all invoices with optional filtering
 */
export async function getInvoices(hospitalId?: string) {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase.from("invoices").select(`
     *,
     hospitals (id, name, code)
   `)

    if (hospitalId) {
      query = query.eq("hospital_id", hospitalId)
    }

    const { data, error } = await query.order("date_generated", { ascending: false })

    if (error) throw error

    return { invoices: data, error: null }
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return {
      invoices: null,
      error: "Failed to fetch invoices",
    }
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(invoiceId: string, status: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("invoices")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/billing")
    revalidatePath("/billing")

    return { invoice: data, error: null }
  } catch (error) {
    console.error("Error updating invoice status:", error)
    return {
      invoice: null,
      error: "Failed to update invoice status",
    }
  }
}

/**
 * Send invoice to hospital
 */
export async function sendInvoiceEmail(invoiceId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
       *,
       hospitals (id, name, code, address)
     `)
      .eq("id", invoiceId)
      .single()

    if (fetchError) throw fetchError

    // In a real application, you would send an email here
    // For this example, we'll just update the invoice status
    const { data, error } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/billing")
    revalidatePath("/billing")

    return { success: true, error: null }
  } catch (error) {
    console.error("Error sending invoice:", error)
    return {
      success: false,
      error: "Failed to send invoice",
    }
  }
}
