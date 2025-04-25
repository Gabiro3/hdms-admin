import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { format } from "date-fns"
import { formatCurrency } from "./billing-utils"

/**
 * Generate a PDF from an invoice and download it
 * @param invoice The invoice object to generate a PDF for
 */
export async function generateInvoicePDF(invoice: any): Promise<void> {
  try {
    // Create a temporary container for the invoice content
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.top = "-9999px"
    container.style.width = "800px" // Fixed width for better PDF quality
    document.body.appendChild(container)

    // Render the invoice content
    container.innerHTML = generateInvoiceHTML(invoice)

    // Wait for any images to load
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Convert the HTML to a canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      allowTaint: true,
    })

    // Add the canvas to the PDF
    const imgData = canvas.toDataURL("image/png")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 0

    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // If the content is too long, add more pages
    if (imgHeight * ratio > pdfHeight) {
      let remainingHeight = imgHeight * ratio
      let currentPosition = pdfHeight

      while (remainingHeight > pdfHeight) {
        pdf.addPage()
        pdf.addImage(imgData, "PNG", imgX, -currentPosition, imgWidth * ratio, imgHeight * ratio)
        remainingHeight -= pdfHeight
        currentPosition += pdfHeight
      }
    }

    // Download the PDF
    pdf.save(`Invoice-${invoice.invoice_number}.pdf`)

    // Clean up
    document.body.removeChild(container)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

/**
 * Generate HTML content for the invoice PDF
 * @param invoice The invoice object
 * @returns HTML string for the invoice
 */
function generateInvoiceHTML(invoice: any): string {
  const details = invoice.details || {}
  const hospitalName = details.hospitalName || invoice.hospitals?.name || "Unknown Hospital"
  const hospitalAddress = details.hospitalAddress || invoice.hospitals?.address || ""
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

  // Generate diagnosis rows
  let diagnosisRows = ""
  Object.entries(diagnosisByType).forEach(([type, data]) => {
    diagnosisRows += `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${type}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${data.count}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${formatCurrency(data.cost / data.count)}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${formatCurrency(data.cost)}</td>
      </tr>
    `
  })

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <!-- Letterhead -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <div style="background-color: #2563eb; color: white; padding: 12px; border-radius: 8px; margin-right: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div>
            <h2 style="font-size: 24px; font-weight: bold; margin: 0;">INVOICE</h2>
            <p style="color: #6b7280; margin: 0;">${invoice.invoice_number}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: bold; margin: 0;">Healthlink Rwanda HDMS</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">KN 5 Rd, Kigali</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Rwanda</p>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">info@healthlinkrwanda.org</p>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

      <!-- Bill To -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Bill To:</p>
          <p style="font-weight: bold; margin: 0;">${hospitalName}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">${hospitalAddress}</p>
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 5px;">
            <span style="color: #6b7280; font-size: 14px;">Invoice Date:</span>
            <span style="font-size: 14px; margin-left: 10px;">${format(new Date(invoice.date_generated), "MMMM d, yyyy")}</span>
          </div>
          <div style="margin-bottom: 5px;">
            <span style="color: #6b7280; font-size: 14px;">Billing Period:</span>
            <span style="font-size: 14px; margin-left: 10px;">
              ${format(new Date(invoice.start_date), "MMMM d")} - ${format(new Date(invoice.end_date), "MMMM d, yyyy")}
            </span>
          </div>
          <div>
            <span style="color: #6b7280; font-size: 14px;">Status:</span>
            <span style="font-size: 14px; font-weight: bold; color: #2563eb; margin-left: 10px;">${invoice.status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Summary -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Diagnosis Type</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Unit Price</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${diagnosisRows}
        </tbody>
      </table>

      <!-- Invoice Total -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <p style="font-weight: 500; margin: 0;">Subtotal:</p>
            <p style="margin: 0;">${formatCurrency(invoice.total_amount)}</p>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <p style="font-weight: 500; margin: 0;">Tax (0%):</p>
            <p style="margin: 0;">${formatCurrency(0)}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;" />
          <div style="display: flex; justify-content: space-between; font-size: 18px;">
            <p style="font-weight: bold; margin: 0;">Total:</p>
            <p style="font-weight: bold; margin: 0;">${formatCurrency(invoice.total_amount)}</p>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
        <p style="font-weight: 500; margin: 0 0 5px 0;">Notes:</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Payment is due within 30 days of invoice date. Please make payment to Healthlink Rwanda HDMS.
          Thank you for your business.
        </p>
      </div>
    </div>
  `
}
