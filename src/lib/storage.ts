
import { r2 } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function uploadToR2(file: File, folder: string = 'uploads'): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // 1. Format date as YYYYMMDD
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  
  // 2. Extract extension and sanitize base name
  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : 'bin';
  const baseName = nameParts.join('-'); 
  
  // Allow English letters, numbers, Thai characters, spaces, and dashes. Max 50 chars.
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s-]/g, '') 
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50);
    
  const finalBaseName = cleanBaseName || "document";
  
  // 3. Generate short unique ID (first 8 chars of UUID)
  const uniqueId = crypto.randomUUID().split('-')[0];
  
  // 4. Construct Structured Path: folder/YYYYMMDD_UUID_filename.ext
  const fileName = `${folder}/${dateStr}_${uniqueId}_${finalBaseName}.${ext}`;

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
