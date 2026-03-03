# Prime Platform - System Architecture & Logic Flow

*คำขยายความสำหรับนำไปใส่ AI เพื่อวาดภาพ Diagram (Architecture & User Flow)*

นี่คือเอกสารสรุปการโต้ตอบและสถาปัตยกรรมของโครงการ **Prime Platform (Event & Registration Management)** เพื่อให้นำไปให้ AI (เช่น ChatGPT, Midjourney, หรื่อเครื่องมือวาด Diagram) แปลงเป็นภาพโครงสร้างระบบได้ทันที

---

## 🏗️ 1. High-Level Architecture (โครงสร้างเทคโนโลยีภาพรวม)
**Type of Diagram:** System Architecture Diagram  
**Core Stack:**
*   **Frontend / Client:**
    *   Next.js 15 (React 19) - Server Components & Client Components
    *   Tailwind CSS (Styling) / Shadcn UI (Components)
*   **Backend / API:**
    *   Next.js Server Actions (No traditional REST API / GraphQL)
    *   NextAuth.js (Authentication - Admin Role Only)
*   **Database & Storage:**
    *   **Supabase PostgreSQL**: ฐานข้อมูลหลัก (ผ่าน Connection Pooling `pgbouncer=true`)
    *   **Prisma ORM**: ตัวกลางคุยกับฐานข้อมูล
    *   **Cloudflare R2 (S3 API)**: ตัวเก็บไฟล์เอกสาร/รูปภาพแนบ
*   **External Integrations:**
    *   **Gmail SMTP / Resend**: ระบบส่ง Email Ticket+QR Coder ให้ผู้ร่วมงาน

**Data Flow (การไหลของข้อมูล):**
`Client Browser` <--> `Next.js App Router (Vercel)` <--> `Prisma ORM` <--> `Supabase (PostgreSQL)`
และ
`Client Browser` --(Direct Upload via Presigned URL)--> `Cloudflare R2`

---

## 👤 2. Admin Flow (การทำงานฝั่งผู้จัดงาน)
**Type of Diagram:** User Journey / Flowchart

1.  **Authentication:**
    *   แอดมินเข้าสู่ระบบที่ `/login` ผ่าน NextAuth (เช็ค Role `ADMIN` ใน Database)
2.  **Dashboard (`/dashboard`):** 
    *   เช็คสถิติ (Total Events, Registrations, Check-in %) แบบ Real-time
3.  **Event Management:**
    *   แอดมินสร้างตีมงาน (ชื่อ, แบนเนอร์, วันและเวลา)
    *   **Form Builder:** แอดมินลากวางเพื่อ "สร้างแบบฟอร์ม" (Text, Dropdown, Radio, File Upload) 
    *   ระบบแปลงแบบฟอร์มเป็น JSON บันทึกลงตาราง `Event (formFields)`
4.  **Monitoring & Check-in:**
    *   แอดมินสามารถเปิดดู **Responses Table** ว่าใครสมัครมาบ้าง
    *   แอดมินสามารถโหลด QR Scanner เปิดกล้องมือถือ/คอม ที่หน้า `/check-in` 
    *   แอดมินส่งหน้าลิงก์ **Live Board** ขึ้นจอใหญ่ในงาน เพื่อโชว์ยอดเช็คอินและชื่อคนล่าสุดที่เดินเข้างาน

---

## 🎟️ 3. Attendee Flow (การทำงานฝั่งผู้เข้าร่วมงาน)
**Type of Diagram:** User Journey / Flowchart

1.  **Landing Page:**
    *   ผู้เข้าร่วมงานเห็นหน้าโปรโมทกิจกรรม (รูปแบนเนอร์, รายละเอียด)
2.  **Registration (Dynamic Form):**
    *   กรอกข้อมูลตามที่แอดมินตั้งค่าโจทย์รั้งไว้ (ดึง JSON จาก DB มาเรนเดอร์ UI อัตโนมัติ)
3.  **File Uploading (ถ้าฟอร์มบังคับส่งไฟล์):**
    *   ระบบขอ "Presigned URL" จากหลังบ้าน (Next.js)
    *   อัปโหลดไฟล์ตรงจากมือถือเข้า **Cloudflare R2** โดยไม่ผ่าน Server ทำเว็บ
    *   เก็บแค่ Link รูป ใส่ลงในช่องคำตอบ
4.  **Submission & Generation:**
    *   กดยืนยันการสมัคร หลังบ้านจะรับข้อมูลไปบันทึกลงตาราง `Registration`
    *   ระบบ Generate รหัสอ้างอิงสั้น 8 ตัวอักษร เช่น `REF-AB123`
    *   สร้าง **QR Code** ฝังข้อมูล `REF-AB123`
5.  **Email Sending:**
    *   ส่ง Email ยืนยันที่ตอบรับพร้อมแนบตั๋ว (QR Code) กลับให้ผู้ใช้อัตโนมัติ (ผ่าน NodeMailer/Resend)
6.  **Success Page:** 
    *   แสดงหน้าขอบคุณและโชว์ QR Code บนเว็บให้ผู้ใช้งานแคปหน้าจอกลับไปได้
7.  **Event Day (วันงาน):**
    *   เดินมาที่หน้าประตูงาน โชว์ QR
    *   สแกนปุ๊บ ข้อมูลจะลิงก์เข้าไปยิงตาราง `CheckIn` ใน Database ทันที พร้อมเด้งขึ้น Live Board

---

## 🗄️ 4. Entity Relationship Diagram (ERD Schema)
**Type of Diagram:** Database Schema / ERD
*   **User**: แอดมินระบบ (Email, Password, Role)
*   **Event**: งานกิจกรรมต่างๆ (Title, Slug, Date, Banner, Status, **formFields[JSON]**)
*   **Registration**: ข้อมูลการสมัคร (EventID, ReferenceCode, **formData[JSON]**, createdAt)
*   **CheckIn**: ข้อมูลการโชว์ตัวหน้าประตู (RegistrationID, ScannedAt)

**Relationships:**
*   **1 Event** มีได้หลาย **Registrations** (1-to-many)
*   **1 Registration** มีได้แค่ 1 **CheckIn** (1-to-1)

---

## 💡 Prompt Template (เพื่อนำไปป้อนให้ AI)

คุณสามารถนำกล่องข้อความนี้ ไปวางใน ChatGPT, Claude หรือ AI อื่นๆ เพื่อให้ระบบวิเคราะห์ละสร้าง Prompt ภาพได้เลย:

> "Act as a software architect. I have built an event registration platform with the following logic and stack:
> 
> **Stack:** Next.js 15, Supabase (PostgreSQL), Prisma ORM, Cloudflare R2 (for file storage), Tailwind CSS.
> **Key Architecture:** Uses Next.js Server Actions with direct-to-cloud file uploads using AWS S3 Presigned URLs pointing to Cloudflare R2.
> **Flow:** Admin creates an Event with a dynamic Form layout (JSON). User visits the public page, fills out the dynamic form, and optionally uploads a file directly to R2. On submission, the system generates a unique Reference Code and QR Code, saves the registry to Supabase, and emails the user via Nodemailer. On event day, the admin uses an HTML5 QR Scanner to check the user in real-time, displaying their name on a Live Dashboard.
> 
> Please generate a descriptive Mermaid.js diagram code that illustrates this full System Architecture and Data Flow."
