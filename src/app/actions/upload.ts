'use server'

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

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
