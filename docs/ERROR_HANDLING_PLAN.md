# 🛡️ Prime Platform: Robust Error Handling Strategy

This document outlines the plan to transform the current error handling logic into a unified, production-grade system that ensures reliability and a better user experience.

---

## 📋 1. Current State Assessment
- **UI Feedback**: Primarily uses localized `<Alert>` components or inline error messages (e.g., in `registration-form.tsx`).
- **Error Boundaries**: Next.js `error.tsx` files are present at the root, admin, and public levels, but provide minimal diagnostic info.
- **Server Actions**: Currently return simple `{ success: boolean, message: string, ... }` objects.
- **Missing**: A global "Toast" notification system and a standardized way to handle backend exceptions.

---

## 🏗️ 2. Proposed Improvements

### A. Standardized Server Action Responses
We will move away from inconsistent return types and use a unified `ActionResult` type.
- **Target**: `src/lib/action-result.ts`
- **Structure**:
  ```typescript
  type ActionResult<T = any> = {
    success: boolean;
    data?: T;
    error?: {
      code: string;       // e.g., 'UNAUTHORIZED', 'VALIDATION_FAILED'
      message: string;    // Human-readable message
      fields?: Record<string, string[]>; // For Zod validation errors
    }
  }
  ```

### B. Global Notification System (Toasts)
Instead of forcing the user to scroll to find an `<Alert>` component, we will implement a non-intrusive toast system.
- **Choice**: `Sonner` (standard in Shadcn/React 19 ecosystem).
- **Implementation**: Add `<Toaster />` to the root layout and use `toast.error()` or `toast.success()` in client components.

### C. Advanced Error Boundaries
Enhance existing `error.tsx` files to:
- Log the error code/digest to a central service (or simple server log for now).
- Provide a "Copy Error ID" button to help users report issues to admins.
- Differentiate between "Expected" errors (404, Unauthorized) and "Crash" errors (Database down).

### D. Zod-to-Form Error Mapping
Refactor Server Actions to return field-level errors that `react-hook-form` can consume automatically.
- **Utility**: Create a helper to map Prisma/Zod errors into our standardized `ActionResult`.

---

## 🚀 3. Implementation Roadmap

### Phase 1: Foundation (Short Term)
1.  **Install Sonner**: Add the `sonner` package and the Shadcn component.
2.  **Define Utility**: Create `src/lib/error-utils.ts` to handle error formatting and logging.
3.  **Root Layout Update**: Inject the `<Toaster />` component globally.

### Phase 2: Refactoring (Medium Term)
1.  **Admin Actions**: Update `events.ts` and `registration.ts` actions to use the new `ActionResult` pattern.
2.  **Form Builder**: Update the Admin UI to show toast notifications when saving forms fails.
3.  **Check-in Logic**: Move check-in feedback from inline alerts to toasts for a faster "scan-and-go" feel.

### Phase 3: Resilience (Long Term)
1.  **Retry Logic**: Implement exponential backoff for failed file uploads to Cloudflare R2.
2.  **Database Connection Recovery**: Add custom logic to handle transient Prisma connection pool timeouts.

---

## ✅ 4. Success Criteria
- [ ] No more "Silent Failures": Every failed user action must result in visible feedback.
- [ ] Type Safety: Server Action results are strictly typed.
- [ ] Admin Diagnostics: Errors include unique IDs for faster debugging.

---

*Prepared by Gemini CLI*
