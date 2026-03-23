# Minerva - IIML Academic Portal (MVP v2.0)
A dynamic, sleek, role-based Next.js application for securely managing college examination marks, configuring scoring breakpoints, processing PDF/XLSX uploads, tracking multi-stage approval audit logs, and rendering comprehensive points tables.

## 🚀 Tech Stack
- Frontend: Next.js 14 App Router, Tailwind CSS, Lucide Icons, React Hot Toast
- Backend API: Next.js Edge APIs
- Authentication: `jose` Edge-compatible JWT stored in HTTP-Only Cookies
- File Parsing: `xlsx` library
- Email Transport: `nodemailer` (Mocks to terminal automatically without credentials)
- Database: Supabase PostgreSQL (Fully relational with schema validations)

## 🛠️ Step 1: Initialization & Running Locally
Ensure you have `Node.js 18+`. Then:
```bash
npm install
```

Copy the `.env.local` template (already provided) and populate it with your Supabase keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Connect your Supabase instance by running the schema logic defined in `supabase/migrations/01_schema.sql` inside the Supabase *SQL Editor*.

Start the development server:
```bash
npm run dev
```

## 🌱 Step 2: Database Seeding
To immediately populate realistic data (an Admin office user, 1 active CR, 1 pending CR, 10 fully registered Students in a sample Course w/ Breakdowns):
```bash
node seed.ts
```
_Login with:_ `office@iiml.ac.in` | Password: `@IIM`

## 🗂️ Project Structure Overview
- `/src/lib/auth.ts`: Central JWT Authentication Logic
- `/src/middleware.ts`: Secures routes utilizing RBAC methodology
- `/src/app/api`: All backend microservices mapped route-to-route
- `/src/app/dashboard/*`: Authenticated User Experience containing:
  - **Courses**: Create strict batch mappings for classes
  - **Admin/CR**: Approve and track incoming Class Representative applications
  - **Marks**: Granular CSV uploading w/ dynamic Conflict and Validation layers.
  - **Audit Log**: Immutable Trail exportable directly out as XLSX

## 🧪 Important Design Choices & Architecture
- **JWT Integrity**: Token-based strategy leveraging robust `jose` to ensure edge-networking runtime compatibility and eliminate scaling dependencies. Let Supabase securely handle backend state and raw REST validation.
- **Marks Data Normalization**: Avoids massive schema changes down the road. All uploaded scores are pushed into single relation logic and dynamically snapshotted for ranking.
- **Zero-Trust Logic**: OTP system intercepts every single "Re-Upload" request forced by a Class Representative, isolating the request and demanding synchronous approval validation natively via email verification loops. 
# minerva
