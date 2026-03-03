// A simple in-memory rate limiter using Map
// Note: In a Serverless environment like Vercel, this memory is per-instance and may reset when instances spin down.
// For strict global rate limiting, a Redis store is recommended, but this is a solid layer out-of-the-box.

interface RateLimitData {
  count: number
  startTime: number
}

const limitStore = new Map<string, RateLimitData>()

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now()
        for (const [ip, data] of limitStore.entries()) {
            if (now - data.startTime > 300000) { // older than 5 minutes
                limitStore.delete(ip)
            }
        }
    }, 300000)
}

/**
 * Checks if the given IP has exceeded the limit.
 * @param ip Client IP address
 * @param limit Max requests allowed
 * @param windowMs Time window in milliseconds
 * @returns boolean `true` if passed, `false` if rate limited
 */
export async function getRateLimit(ip: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now()
  const current = limitStore.get(ip)

  if (!current) {
    limitStore.set(ip, { count: 1, startTime: now })
    return true
  }

  // If outside of the time window, reset the count
  if (now - current.startTime > windowMs) {
    limitStore.set(ip, { count: 1, startTime: now })
    return true
  }

  // If inside the time window, check limit
  if (current.count >= limit) {
    return false
  }

  // Increment count
  current.count += 1
  return true
}
