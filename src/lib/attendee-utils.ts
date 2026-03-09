/**
 * Extract attendee name and email from registration formData.
 * Handles multiple field key formats for backward compatibility:
 * - New format: __name__, __email__ (from DEFAULT_FIELDS)
 * - Legacy format: name, email, default_name, default_email
 * - Thai format: ชื่อ-นามสกุล, อีเมล, etc.
 * - Fallback: first TEXT-like value for name, first email-like value for email
 */
export function extractAttendeeInfo(
  formData: Record<string, unknown>,
  formFields?: { id: string; label: string; type?: string }[]
): {
  name: string
  email: string
  phone: string
} {
  const data = formData || {}

  let exactName = null;
  let exactEmail = null;
  let exactPhone = null;

  if (formFields && formFields.length > 0) {
      // Find ALL fields that could act as name, email, or phone
      const nameFields = formFields.filter(f => f.label.includes("ชื่อ") || f.label.toLowerCase().includes("name") || f.id === "__name__");
      for (const f of nameFields) {
          if (data[f.id]) { exactName = data[f.id]; break; }
          if (data[f.label]) { exactName = data[f.label]; break; }
      }

      const emailFields = formFields.filter(f => f.label.includes("อีเมล") || f.label.toLowerCase().includes("email") || f.id === "__email__" || f.type === "EMAIL");
      for (const f of emailFields) {
          if (data[f.id]) { exactEmail = data[f.id]; break; }
          if (data[f.label]) { exactEmail = data[f.label]; break; }
      }
      
      const phoneFields = formFields.filter(f => f.label.includes("เบอร์โทร") || f.label.toLowerCase().includes("phone") || f.id === "__phone__" || f.type === "PHONE");
      for (const f of phoneFields) {
          if (data[f.id]) { exactPhone = data[f.id]; break; }
          if (data[f.label]) { exactPhone = data[f.label]; break; }
      }
  }

  // Name extraction — check all possible keys
  const name =
    exactName ||
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
    exactEmail ||
    data["__email__"] ||
    data["email"] ||
    data["default_email"] ||
    data["อีเมล"] ||
    // Fallback: find first value that looks like an email
    findEmailValue(data) ||
    "N/A"

  // Phone extraction
  const phone =
    exactPhone ||
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

/**
 * Get the IDs of the fields that map to standard Registration fields (Name, Email, Phone)
 * so we can exclude them from dynamic custom column lists avoid duplicates.
 */
export function getStandardFieldIds(formFields?: { id: string; label: string; type?: string }[]): string[] {
    if (!formFields || formFields.length === 0) return [];
    
    const ids: string[] = [];
    
    // Explicitly track anything that looks like Name, Email, or Phone
    const nameFields = formFields.filter(f => f.label.includes("ชื่อ") || f.id === "__name__" || f.id.toLowerCase() === "name");
    nameFields.forEach(f => ids.push(f.id));

    const emailFields = formFields.filter(f => f.label.includes("อีเมล") || f.label.toLowerCase().includes("email") || f.id === "__email__" || f.id.toLowerCase() === "email" || f.type === "EMAIL");
    emailFields.forEach(f => ids.push(f.id));
    
    const phoneFields = formFields.filter(f => f.label.includes("เบอร์โทร") || f.label.toLowerCase().includes("phone") || f.id === "__phone__" || f.id.toLowerCase() === "phone" || f.type === "PHONE");
    phoneFields.forEach(f => ids.push(f.id));

    return ids;
}
