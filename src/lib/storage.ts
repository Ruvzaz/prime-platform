
import { r2 } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function uploadToR2(file: File, folder: string = 'uploads'): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // 1. Sanitize filename: remove special chars, replace spaces
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
  
  // 2. Generate unique ID
  const uniqueId = crypto.randomUUID();
  
  // 3. Construct Path: folder/uuid-filename
  const fileName = `${folder}/${uniqueId}-${cleanName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })
  );

  // Assumes R2_PUBLIC_URL is set in .env
  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}
