'use server'

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getRateLimit } from "@/lib/rate-limit"
import { headers } from "next/headers"

const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // Documents
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  eventSlug: string,
  attendeeName: string
) {
  // 1. Rate Limiting (10 requests per 10 minutes)
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "unknown-ip"
  
  const isAllowed = await getRateLimit(ip, 10, 10 * 60 * 1000)
  if (!isAllowed) {
    return { success: false, error: "Too Many Requests. Please wait." }
  }

  // 2. Strict MIME Type Validation
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { 
      success: false, 
      error: "ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้ ระบบรองรับเฉพาะรูปภาพ และไฟล์ PDF/Word เท่านั้น" 
    }
  }

  try {
    const bucketName = process.env.R2_BUCKET_NAME!
    
    // Sanitize inputs for safe S3 keys
    const safeAttendeeName = attendeeName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'anonymous'
    const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const uniqueId = Math.random().toString(36).substring(2, 8)
    
    const key = `${eventSlug}/${safeAttendeeName}/${Date.now()}-${uniqueId}-${safeFileName}`

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    })

    // Generate a pre-signed URL valid for 5 minutes
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })
    
    // Construct the final public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return { success: true, presignedUrl, publicUrl, key }
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    return { success: false, error: "Failed to generate upload URL" }
  }
}
