import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function main() {
  console.log('Testing R2 Connection...');
  try {
    // 1. List Buckets
    const { Buckets } = await r2.send(new ListBucketsCommand({}));
    console.log('✅ Connection Successful. Buckets:', Buckets?.map(b => b.Name).join(', '));

    // 2. Test Upload (Optional)
    if (process.env.R2_BUCKET_NAME) {
        console.log(`Attempting upload to bucket: ${process.env.R2_BUCKET_NAME}`);
        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: 'test-connection.txt',
            Body: 'Hello from Prime Platform!',
            ContentType: 'text/plain'
        }));
        console.log('✅ Test Upload Successful');
    } else {
        console.log('⚠️ R2_BUCKET_NAME not set, skipping upload test.');
    }

  } catch (error) {
    console.error('❌ R2 Connection Failed:', error);
  }
}

main();
