'use server';

import { r2 } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@/auth';

export async function uploadFile(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: 'Unauthorized' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, message: 'No file provided' };
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return { success: false, message: 'Invalid file type. Only images are allowed.' };
  }

  // Validate file size (e.g., 4MB limit)
  if (file.size > 4 * 1024 * 1024) {
    return { success: false, message: 'File size too large. Max 4MB.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `events/${Date.now()}-${file.name.replace(/\s/g, '-')}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Construct Public URL
    // Assumes R2_PUBLIC_URL is set in .env (e.g., https://pub-xxx.r2.dev)
    // If using custom domain, usage might differ.
    const url = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return { success: true, url };
  } catch (error) {
    console.error('Upload Error:', error);
    return { success: false, message: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') };
  }
}
