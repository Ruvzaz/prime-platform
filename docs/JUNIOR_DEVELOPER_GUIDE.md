# 🎓 Junior Developer Guide - Prime Platform

Welcome to the Prime Platform codebase! This guide is designed to help you understand the architecture, patterns, and logic used in this project.

---

## 🏗️ 1. Project Overview & Tech Stack

Prime Platform is an event management system built with **Next.js 15 (App Router)**. It handles everything from custom registration forms to QR-code based check-ins.

### The Stack:
- **Next.js 15**: The React framework. We use the `app/` directory.
- **Prisma**: Our Database ORM (Object-Relational Mapper). It makes talking to the database feel like writing JavaScript.
- **Tailwind CSS + Shadcn UI**: For styling. We use "Glassmorphism" (translucency) for a premium feel.
- **NextAuth.js**: Handles login and session management.
- **Zod**: Used for validating data (making sure inputs are the right type and length).

---

## 📁 2. Where is everything? (Folder Structure)

We use Next.js **Route Groups** (folders with parentheses like `(admin)`) to organize the app:

- `src/app/(admin)`: Pages that only logged-in administrators can see (Dashboard, Event creation).
- `src/app/(public)`: Pages anyone can see (The registration form for an event).
- `src/app/(staff)`: Specialized pages for staff members (QR scanning).
- `src/app/actions`: This is where the **Server-Side Logic** lives. Instead of APIs, we use "Server Actions".
- `src/components/ui`: Low-level components from Shadcn (Buttons, Inputs). You usually don't edit these.
- `src/components/admin` & `src/components/public`: Mid-level components specific to those areas.
- `prisma/schema.prisma`: The "Source of Truth" for our database structure.

---

## ⚡ 3. The Core Concept: Dynamic Forms

The most important feature is that admins can **build their own forms** for each event.

1.  **Construction**: In `src/components/admin/form-builder.tsx`, an admin adds fields (Name, Email, etc.).
2.  **Storage**: These fields are saved in the `FormField` table in the database, linked to an `Event`.
3.  **Rendering**: When a user visits a public event page, `src/components/public/registration-form.tsx` loops through those fields and renders the correct input (Input, Select, Checkbox).
4.  **Submission**: The user's answers are stored in a single JSON column called `formData` in the `Registration` table.

---

## 🛠️ 4. Common Patterns to Follow

### A. How to fetch data
In Next.js 15, we fetch data directly in **Server Components** (the default in `src/app`):
```tsx
// This is a Server Component
export default async function Page() {
  const events = await prisma.event.findMany(); // Talk to DB directly
  return <EventsTable data={events} />;
}
```

### B. How to change data (Server Actions)
When a user clicks "Submit", we use a Server Action. Look at `src/app/actions/registration.ts` for an example.
- We use `useActionState` in the component to handle loading and error messages.
- We use `zod` inside the action to validate the `formData`.

### C. Role-Based Security
We protect routes in two ways:
1.  **Layouts**: `src/app/(admin)/layout.tsx` checks if the user is an `ADMIN`. If not, they can't see the pages inside.
2.  **Actions**: Every admin action (like `createEvent`) checks the user's role again on the server for safety.

---

## 🚀 5. Your First Tasks (How-To)

### Adding a new UI Component
1. Run `npx shadcn@latest add [component-name]`.
2. It will appear in `src/components/ui`.
3. Import and use it!

### Modifying the Database
1. Change `prisma/schema.prisma`.
2. Run `npx prisma generate`.
3. Run `npx prisma db push` (on Windows/Local) to update your database.

### Styling
- Use Tailwind classes.
- If you need a custom color, check `src/app/globals.css`.
- Avoid hardcoding colors like `bg-zinc-900`; use `bg-background` or `bg-muted` so the theme works correctly.

---

## 💡 Tips for Success
- **Read the Logs**: Terminal logs show server errors; Browser Console logs show client errors.
- **Check the Types**: If TypeScript is complaining, it's usually because a variable might be `null` or `undefined`.
- **Ask the Manual**: The `PRIME_PLATFORM_DEVELOPER_MANUAL.md` has deeper details on R2 uploads and complex logic.

Happy Coding! 🚀
