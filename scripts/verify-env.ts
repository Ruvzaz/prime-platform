import dotenv from 'dotenv';
dotenv.config();

const vars = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'RESEND_API_KEY'
];

console.log('--- Environment Variable Check ---');
vars.forEach(v => {
  const exists = !!process.env[v];
  const length = process.env[v]?.length || 0;
  console.log(`${v}: ${exists ? '✅ SET' : '❌ MISSING'} (Length: ${length})`);
});
console.log('----------------------------------');
