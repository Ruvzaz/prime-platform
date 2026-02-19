# Deployment Guide for Prime Platform 🚀

This guide captures the configuration needed to deploy the application to production (e.g., Vercel).

## 1. Environment Variables
Ensure these variables are set in your production environment (e.g., Vercel Project Settings):

### Database (Prisma/PostgreSQL)
- `DATABASE_URL`: Connection string to your PostgreSQL database (e.g., Supabase Transaction Pooler).
- `DIRECT_URL`: Direct connection string (e.g., Supabase Session Pooler) for migrations.

### Authentication (Auth.js)
- `AUTH_SECRET`: A strong random string (generate with `npx auth secret`).
- `AUTH_URL`: The URL of your deployed app (e.g., `https://your-project.vercel.app`). *Not needed on Vercel if utilizing their Next.js integration.*

### Object Storage (Cloudflare R2)
- `R2_ACCOUNT_ID`: Your Cloudflare Account ID.
- `R2_ACCESS_KEY_ID`: API Token Access Key (Must have Admin Read/Write rights).
- `R2_SECRET_ACCESS_KEY`: API Token Secret.
- `R2_BUCKET_NAME`: Name of your storage bucket (e.g., `prime-platform`).
- `R2_PUBLIC_URL`: Public domain for the bucket (e.g., `https://pub-xxx.r2.dev`).

### Email (Resend)
- `RESEND_API_KEY`: API Key starting with `re_`.

## 2. Build & Deploy
The application is a standard Next.js app.

- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next` (Standard)

### Database Migration
During the build process or before promoting to production, ensure the database schema is up to date:
```bash
npx prisma migrate deploy
```
*Note: Do not use `prisma migrate dev` in production.*

## 3. Post-Deployment Checks
1.  **Login**: Verify Admin login works.
2.  **Storage**: Upload a test image to an event.
3.  **Email**: Register for an event and check if the email arrives.
