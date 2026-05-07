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
      // 1. Check for strict IDs first (Best case)
      const nameField = formFields.find(f => f.id.startsWith("__name__"));
      if (nameField && data[nameField.id]) {
          exactName = data[nameField.id];
      }

      const emailField = formFields.find(f => f.id.startsWith("__email__"));
      if (emailField && data[emailField.id]) {
          exactEmail = data[emailField.id];
      }

      const phoneField = formFields.find(f => f.id.startsWith("__phone__"));
      if (phoneField && data[phoneField.id]) {
          exactPhone = data[phoneField.id];
      }

      // 2. Fallback to fuzzy matching ONLY if exact fields weren't found OR were empty
      if (!exactName) {
          const fuzzyNameField = formFields.find(f => 
            f.id.toLowerCase() === "name" || 
            f.label === "ชื่อ" || 
            f.label === "ชื่อ-นามสกุล" ||
            f.label === "ชื่อ - นามสกุล"
          );
          if (fuzzyNameField) exactName = data[fuzzyNameField.id] || data[fuzzyNameField.label];
      }

      if (!exactEmail) {
          const fuzzyEmailField = formFields.find(f => 
            f.id.toLowerCase() === "email" || 
            f.label === "อีเมล" || 
            f.type === "EMAIL"
          );
          if (fuzzyEmailField) exactEmail = data[fuzzyEmailField.id] || data[fuzzyEmailField.label];
      }

      if (!exactPhone) {
          const fuzzyPhoneField = formFields.find(f => 
            f.id.toLowerCase() === "phone" || 
            f.label === "เบอร์โทร" || 
            f.label === "โทรศัพท์" ||
            f.type === "PHONE"
          );
          if (fuzzyPhoneField) exactPhone = data[fuzzyPhoneField.id] || data[fuzzyPhoneField.label];
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
    
    // If __name__ or __email__ exist, they are the ONLY standard fields for those categories.
    const hasStrictName = formFields.some(f => f.id.startsWith("__name__"));
    const hasStrictEmail = formFields.some(f => f.id.startsWith("__email__"));
    const hasStrictPhone = formFields.some(f => f.id.startsWith("__phone__"));

    formFields.forEach(f => {
        // Name matching
        if (f.id.startsWith("__name__")) {
            ids.push(f.id);
        } else if (!hasStrictName && (f.id.toLowerCase() === "name" || f.label === "ชื่อ" || f.label === "ชื่อ-นามสกุล")) {
            ids.push(f.id);
        }

        // Email matching
        if (f.id.startsWith("__email__")) {
            ids.push(f.id);
        } else if (!hasStrictEmail && (f.id.toLowerCase() === "email" || f.label === "อีเมล" || f.type === "EMAIL")) {
            ids.push(f.id);
        }

        // Phone matching
        if (f.id.startsWith("__phone__")) {
            ids.push(f.id);
        } else if (!hasStrictPhone && (f.id.toLowerCase() === "phone" || f.label === "เบอร์โทร" || f.type === "PHONE")) {
            ids.push(f.id);
        }
    });

    return Array.from(new Set(ids));
}

/**
 * Mask name for privacy (e.g., "John Doe" -> "J*** D***")
 */
export function maskName(name: string): string {
  if (!name || name === "Unknown") return name;
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    const word = parts[0];
    if (word.length <= 1) return word;
    if (word.length === 2) return word[0] + "*";
    return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
  }
  
  // For multiple words, mask each except first and last character of each word if long enough
  return parts.map(part => {
    if (part.length <= 1) return part;
    if (part.length === 2) return part[0] + "*";
    return part[0] + "*".repeat(Math.min(part.length - 2, 3)) + part[part.length - 1];
  }).join(" ");
}

/**
 * Mask email for privacy (e.g., "john.doe@example.com" -> "jo***@ex***.com")
 */
export function maskEmail(email: string): string {
  if (!email || email === "N/A" || !email.includes("@")) return email;
  
  const [user, domain] = email.split("@");
  if (!domain) return email;
  
  const maskedUser = user.length <= 2 
    ? user + "***" 
    : user.substring(0, 2) + "***";
    
  const domainParts = domain.split(".");
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join(".");
  
  const maskedDomain = domainName.length <= 2
    ? domainName + "**"
    : domainName.substring(0, 2) + "**";
    
  return `${maskedUser}@${maskedDomain}${tld ? "." + tld : ""}`;
}

