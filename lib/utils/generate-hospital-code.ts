export function generateHospitalCode(): string {
  // Generate a random 5-digit number
  const randomDigits = Math.floor(10000 + Math.random() * 90000)

  // Format as HSP-XXXXX
  return `HSP-${randomDigits}`
}
