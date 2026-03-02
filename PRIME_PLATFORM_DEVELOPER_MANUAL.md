# PRIME PLATFORM - Developer Context Manual

> **Purpose:** 
> This document serves as the absolute source of truth for the Prime Platform's architecture, design decisions, and bespoke features. 
> 
> *Provide this file to the AI assistant when starting a fresh chat to immediately restore project context.*

---

## 🏗️ 1. Core Tech Stack
*   **Framework**: Next.js 15 (App Router) + React 19. 
*   **Styling**: Tailwind CSS v4 + Shadcn UI (Customized heavily for premium Glassmorphism).
*   **Database**: PostgreSQL hosted on Supabase (accessed via Connection Pooling `?pgbouncer=true`).
*   **ORM**: Prisma ORM (`v5.22.0`).
*   **Authentication**: NextAuth.js (`v5.0.0-beta.30`) using Credentials Provider (Role-based: `ADMIN`).
*   **Emails**: Nodemailer / Resend.
*   **Testing**: Playwright (`test:e2e`) + Vitest (`test`).

---

## 🎨 2. Design System & Aesthetics
*   **Global Theme**: The application recently underwent a massive visual overhaul, pivoting from dark/purple gradients to a **Premium Light Monochrome & Dashboard Aesthetic**.
*   **Color Palette (`globals.css`)**:
    *   `--background`: Pure White (`#ffffff`) or Light-Dashboard Gray (`#f4f7f9`).
    *   `--primary`: Strong Branded Blue (`#3b82f6` or `#4a89c8`).
    *   `--accent`: Pastel Yellow (`#fae29c`) used for highlights and Skeleton loaders.
*   **Component Overrides**:
    *   Hardcoded background strings (e.g. `bg-zinc-950`) were globally stripped from `layout.tsx` and public pages (`live`, `events`) to ensure `globals.css` animated blobs display consistently underneath transparent cards.
    *   Form elements use custom transitions (e.g., SVG checkmarks in checkboxes, smooth expanding accordions).

---

## 🚀 3. Core Features & Architecture

### A. Dynamic Registration Form Builder
*   **Where it lives**: `src/components/admin/form-builder.tsx`
*   **How it works**: Admins can construct custom forms per Event. The UI structure is serialized into a JSON array and stored in the Prisma `Event.formFields` column.
*   **Supported Types**: `TEXT`, `EMAIL`, `PHONE`, `NUMBER`, `SELECT`, `CHECKBOX`, `RADIO`, and `FILE`.
*   **Special Logic**: 
    *   `RADIO` and dropdowns support an `allowOther` boolean. If true, the public UI seamlessly animates to reveal an "อื่นๆ (โปรดระบุ)..." text input.

### B. Cloudflare R2 File Uploads
*   **Architecture**: Direct-to-Cloud (Presigned URLs).
*   **Implementation**: 
    1.  The `<FileUpload>` component (`src/components/public/file-upload.tsx`) requests a ticket from the Server Action `getPresignedUrl` (`src/app/actions/upload.ts`).
    2.   The server uses `@aws-sdk/s3-request-presigner` configured with R2 Credentials to sign the ticket.
    3.  The client executes a `PUT` fetch directly to the Cloudflare Edge network (bypassing the Vercel/Node server to save bandwidth).
    4.  Files are strictly organized in the R2 bucket as: `[EventSlug]/[AttendeeName]/[Date]-[UUID]-[FileName]`.
    5.  The Admin `ResponseDataTable` formats incoming R2 URLs into clickable "ดูไฟล์" (View File) badges.

### C. Live Board & QR Check-in System
*   **QR Generation**: `qrcode.react` is utilized. Reference codes (e.g., `REF-XY9Z`) are generated on registration and securely embedded in tickets.
*   **Email Deliverability**: Modified `sendRegistrationEmail` logic in `src/app/actions/registration.ts` incorporates a Try/Catch block; if SMTP fails, the user is still successfully registered and redirected to the success page to view their QR code directly online.
*   **Scanner**: Staff use `html5-qrcode` on the `/check-in` route to scan tickets and trigger the check-in Server Action.
*   **Live Feed**: `/live/[slug]` pulls real-time attendee stats. It has been refactored to use strictly `h-screen overflow-hidden` to prevent ugly browser scrolling.

---

## 🛡️ 4. Security Enhancements
*   All `/admin` Server Actions (`getRegistrations`, `updateEvent`, `deleteCheckIn`) strictly verify `session?.user?.role === 'ADMIN'`, preventing unauthorized public API exploitation.
*   End-to-End (E2E) test suites run via Playwright ensure that routing logic (`auth.config.ts`) protects all dashboard views.
*   Hydration issues have been squashed by encapsulating client-side operations (like `Math.random` generation for UI keys) within `useEffect` boundaries.

---

## 📋 5. Known Quirks / Reminders
*   When pushing Prisma changes (e.g., modifying `enum FieldType`), on certain Windows machines `&&` statements might fail in Powershell. Use `npx prisma generate ; npx prisma db push` instead.
*   Always ensure Zod schemas strictly parse JSON structures coming from `formFields` to prevent application crashes when rendering the admin tables.
*   `UploadThing` and `Vercel Blob` are NOT used. We rely entirely on the manual `S3Client` instantiation for R2.
