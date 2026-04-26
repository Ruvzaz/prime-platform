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

// Strict allowed extensions to prevent executable uploads even if MIME type is spoofed
const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  ".pdf", ".doc", ".docx"
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
  folderName: string = "uploads"
) {
  // 1. Rate Limiting (20 requests per 10 minutes for combined usage)
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "unknown-ip"
  
  const isAllowed = await getRateLimit(ip, 20, 10 * 60 * 1000)
  if (!isAllowed) {
    return { success: false, error: "Too Many Requests. Please wait." }
  }

  // 2. Strict MIME Type Validation
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return { success: false, error: "ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้ ระบบรองรับเฉพาะรูปภาพ และไฟล์ PDF/Word เท่านั้น" }
  }

  // 3. Strict File Extension Validation (Defense in Depth against Spoofing)
  const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { success: false, error: "นามสกุลไฟล์ไม่ปลอดภัยหรือไม่รองรับ กรุณาใช้ไฟล์ .jpg, .png, .pdf หรือ .docx เท่านั้น" }
  }

  try {
    const bucketName = process.env.R2_BUCKET_NAME!
    
    // Sanitize inputs for safe S3 keys to prevent path traversal
    const safeSlug = eventSlug.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'global'
    const safeFolder = folderName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'uploads'
    const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const uniqueId = Math.random().toString(36).substring(2, 8)
    
    // Key structure: event-slug/folder/timestamp-id-filename
    const key = `${safeSlug}/${safeFolder}/${Date.now()}-${uniqueId}-${safeFileName}`

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
