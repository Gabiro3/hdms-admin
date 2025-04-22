/**
 * Generate a secure random password
 * @param length The length of the password (default: 12)
 * @returns A secure random password
 */
export function generateSecurePassword(length = 12): string {
  // Define character sets
  const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ" // Removed confusing characters like I and O
  const lowercaseChars = "abcdefghijkmnopqrstuvwxyz" // Removed confusing characters like l
  const numberChars = "23456789" // Removed confusing characters like 0 and 1
  const specialChars = "!@#$%^&*-_=+"

  // Combine all character sets
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars

  // Ensure we have at least one character from each set
  let password = ""
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length))
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length))
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length))
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length))

  // Fill the rest of the password with random characters
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }

  // Shuffle the password to avoid predictable patterns
  return shuffleString(password)
}

/**
 * Shuffle a string
 * @param str The string to shuffle
 * @returns The shuffled string
 */
function shuffleString(str: string): string {
  const array = str.split("")
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array.join("")
}

/**
 * Validate password strength
 * @param password The password to validate
 * @returns An object with validation results
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Check length
  if (password.length < 8) {
    feedback.push("Password should be at least 8 characters long")
  } else {
    score += Math.min(2, Math.floor(password.length / 4))
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password should contain at least one uppercase letter")
  } else {
    score += 1
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push("Password should contain at least one lowercase letter")
  } else {
    score += 1
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    feedback.push("Password should contain at least one number")
  } else {
    score += 1
  }

  // Check for special characters
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push("Password should contain at least one special character")
  } else {
    score += 1
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push("Password should not contain repeated characters")
    score -= 1
  }

  // Check for common patterns
  const commonPatterns = [
    "123",
    "234",
    "345",
    "456",
    "567",
    "678",
    "789",
    "abc",
    "bcd",
    "cde",
    "def",
    "efg",
    "ghi",
    "hij",
    "password",
    "admin",
    "qwerty",
    "welcome",
  ]

  for (const pattern of commonPatterns) {
    if (password.toLowerCase().includes(pattern)) {
      feedback.push("Password contains common patterns that are easy to guess")
      score -= 1
      break
    }
  }

  // Final score calculation
  score = Math.max(0, Math.min(5, score)) // Clamp score between 0 and 5

  return {
    isValid: feedback.length === 0,
    score,
    feedback,
  }
}

/**
 * Check if a password has been compromised
 * This is a simplified version - in production, you would use a service like "Have I Been Pwned"
 * @param password The password to check
 * @returns Whether the password has been compromised
 */
export async function checkPasswordCompromised(password: string): Promise<boolean> {
  try {
    // In a real implementation, you would use the "Have I Been Pwned" API or similar
    // This is a placeholder implementation
    return false
  } catch (error) {
    console.error("Error checking if password has been compromised:", error)
    return false
  }
}
