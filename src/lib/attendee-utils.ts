/**
 * Extract attendee name and email from registration formData.
 * Handles multiple field key formats for backward compatibility:
 * - New format: __name__, __email__ (from DEFAULT_FIELDS)
 * - Legacy format: name, email, default_name, default_email
 * - Thai format: ชื่อ-นามสกุล, อีเมล, etc.
 * - Fallback: first TEXT-like value for name, first email-like value for email
 */
export function extractAttendeeInfo(formData: Record<string, unknown>): {
  name: string
  email: string
  phone: string
} {
  const data = formData || {}

  // Name extraction — check all possible keys
  const name =
    data["__name__"] ||
    data["name"] ||
    data["default_name"] ||
    data["ชื่อ-นามสกุล"] ||
    data["ชื่อ - นามสกุล"] ||
    data["ชื่อ"] ||
    // Fallback: find first key that looks like a name field
    findByLabelPattern(data, ["name", "ชื่อ", "นาม"]) ||
    // Last resort: first non-email string value
    getFirstStringValue(data) ||
    "Unknown"

  // Email extraction — check all possible keys
  const email =
    data["__email__"] ||
    data["email"] ||
    data["default_email"] ||
    data["อีเมล"] ||
    // Fallback: find first value that looks like an email
    findEmailValue(data) ||
    "N/A"

  // Phone extraction
  const phone =
    data["__phone__"] ||
    data["phone"] ||
    data["default_phone"] ||
    data["เบอร์โทรศัพท์"] ||
    data["โทรศัพท์"] ||
    data["tel"] ||
    "N/A"

  return {
    name: String(name),
    email: String(email),
    phone: String(phone),
  }
}

/**
 * Find a value where the key contains any of the given patterns (case-insensitive)
 */
function findByLabelPattern(data: Record<string, unknown>, patterns: string[]): unknown | null {
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    for (const pattern of patterns) {
      if (lowerKey.includes(pattern.toLowerCase()) && value) {
        return value
      }
    }
  }
  return null
}

/**
 * Find the first value that looks like an email address
 */
function findEmailValue(data: Record<string, unknown>): string | null {
  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.includes("@") && value.includes(".")) {
      return value
    }
  }
  return null
}

/**
 * Get the first string value from formData (for name fallback)
 */
function getFirstStringValue(data: Record<string, unknown>): string | null {
  for (const value of Object.values(data)) {
    if (typeof value === "string" && value.length > 0 && !value.includes("@")) {
      return value
    }
  }
  return null
}
