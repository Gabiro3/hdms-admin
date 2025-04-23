/**
 * Billing utility functions
 */

// Define the cost for each diagnosis type
const DIAGNOSIS_COSTS = {
    "X-Ray": 1800,
    "CT Scan": 6300,
    MRI: 12500,
    Mammography: 10000,
    Ultrasound: 5000,
    Other: 11000,
  }
  
  /**
   * Get the diagnosis costs
   * This is a separate function to avoid exporting an object directly from a 'use server' file
   */
  export async function getDiagnosisCosts() {
    return DIAGNOSIS_COSTS
  }
  
  /**
   * Format currency in Rwandan Francs
   */
  export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(amount)
  }
  