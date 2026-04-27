# 🚀 Prime Platform: Project Overview & Improvement Plan

## 📖 1. Project Overview
Prime Platform is a specialized Event Management System (EMS) designed for high-end digital events. It focuses on flexibility, premium aesthetics (Glassmorphism), and real-time attendee engagement.

### Core Value Propositions:
- **Agile Form Building**: Create custom registration workflows without code.
- **High-Speed Check-in**: QR-based scanning for staff with instant feedback.
- **Live Visuals**: Real-time attendee boards for event displays.
- **Direct-to-Cloud Uploads**: Bypassing server bottlenecks using Cloudflare R2.

---

## 🛠️ 2. Current Tech Stack Analysis
- **Framework**: Next.js 16 (App Router) + React 19 (utilizing React Compiler).
- **Database**: PostgreSQL (Prisma ORM) with JSON-based dynamic data storage.
- **Auth**: NextAuth.js v5 (Beta) with role-based access control.
- **Storage**: Cloudflare R2 (S3-compatible) via presigned URLs.
- **Infrastructure**: Optimized for Vercel/Serverless deployment.

---

## 🔍 3. Current State: Areas for Fixes

### 🔴 Critical Fixes
1.  **Rate Limiting Stability**: The current in-memory `Map` in `src/lib/rate-limit.ts` is volatile. In serverless environments, quotas reset unpredictably when instances spin down.
2.  **Registration Search**: Searching through dynamic JSON `formData` currently uses hardcoded keys (name, email). If an admin changes field labels, search becomes less effective.
3.  **Email Reliability**: SMTP/Resend failures are caught and logged but not retried. Users might register but never receive their QR ticket.

### 🟡 Technical Debt
- **Prisma Schema Sync**: The Developer Manual mentions `Event.formFields` as a JSON column, but the actual schema uses a relation table. Documentation needs alignment.
- **Zod Schema Duplication**: Validation logic is repeated across various server actions and components.
- **Hardcoded Limits**: File size limits (4MB/5MB) are scattered across the codebase instead of being centralized.

---

## 🚀 4. Improvement & Feature Roadmap

### Phase 1: Robustness (Short Term)
- [ ] **Global Rate Limiting**: Integrate Upstash Redis for the `getRateLimit` utility to ensure consistent quotas across all serverless instances.
- [ ] **Unified Validation**: Create a shared library for Zod schemas (e.g., `src/lib/validations/`) to ensure consistency between client and server.
- [ ] **Improved Logging**: Implement a centralized logging utility (e.g., Axiom or BetterStack) to track failed email deliveries and R2 upload errors.

### Phase 2: User Experience (Medium Term)
- [ ] **Advanced Form Fields**: Add support for "Signature" fields and "Date/Time" pickers in the Dynamic Form Builder.
- [ ] **Export Enhancements**: Currently, exports are basic. Add support for PDF badge generation and advanced Excel filtering.
- [ ] **Live Feed Polish**: Add more "wow" factor to the `/live` board using Framer Motion animations for incoming attendees.

### Phase 3: Developer Experience (Long Term)
- [ ] **Automated Quality Control**: Setup `husky` and `lint-staged` to run Prettier and ESLint automatically before commits.
- [ ] **E2E Expansion**: Increase Playwright coverage for the edge cases of the form builder (e.g., "allow other" logic and file upload failures).
- [ ] **API Documentation**: Generate Swagger/OpenAPI docs for the internal API routes to facilitate potential mobile app development.

---

## 📈 5. Maintenance Strategy
- **Weekly**: Audit R2 storage for orphaned files.
- **Monthly**: Review database indexes to ensure registration queries remain fast as data grows.
- **Per Release**: Run a performance audit on `globals.css` to ensure the "Glassmorphism" blobs don't degrade FPS on lower-end devices.
