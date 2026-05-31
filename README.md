# Payroll Automation System 📄

Payroll Automation System is a Next.js (App Router + TypeScript) application to ingest payroll CSV/XLSX files, generate password-protected PDF salary slips, and dispatch them to employees via email.

## Live Demo

The application is deployed and available at:

**URL:** https://payroll-automation-system-alpha.vercel.app/

### Demo Credentials

- Email: `admin@example.com`
- Password: `admin@1234`

> These credentials are provided solely for evaluation purposes.
> For production deployments, replace them using the
> `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables for your own deployments.

<br>

**Repository contents**: web UI in `app/`, server API routes in `app/api/`, Prisma models in `prisma/`, and common helpers under `lib/`.

**Tech stack**
- **Framework:** Next.js (App Router) + React
- **Language:** TypeScript
- **Database / ORM:** PostgreSQL + Prisma
- **Styling:** Tailwind CSS / PostCSS
- **Email:** Nodemailer (SMTP)
- **CSV / XLSX parsing:** PapaParse, xlsx
- **PDF generation:** pdf-lib-plus-encrypt
- **Validation:** Zod

## Key features
- Upload CSV / Excel payroll files (bulk employee salary rows)
- Validate and preview parsed rows before processing
- Generate per-employee PDF salary slips
- Encrypt salary slip PDFs with the employee ID as the open password
- Send salary slips by email
- Bulk email dispatch with per-recipient status tracking
- Track upload, slip and email statuses in the database
- Branding settings for company name/address shown in emails and PDFs

## Application flow (how to use)
Quick evaluator checklist:
 - Visit the live demo (https://payroll-automation-system-alpha.vercel.app/) and sign in with the demo credentials (Email: `admin@example.com`, Password: `admin@1234`).
 
 <br>

 - **Optional**: Replace the sample employee email addresses with email addresses you can access. Multiple employee records may share the same email address during testing, making it easy to verify email delivery, PDF attachments, bulk dispatch functionality, and per-recipient status tracking.

 <br>

 - Upload `sample-payroll.csv`, import and generate PDFs.
 - Open a generated PDF with the employee ID from the row to verify password protection.
 - Edit Branding in Settings, then regenerate a PDF to see the change.
 - Try sending one slip to yourself (individual send) and then perform a bulk send.
 - Check the History page for send status and retry failures from the dashboard.

## Samples & testing data
- `sample-payroll.csv` is included for providing the expected payroll format and for quick manual testing. Use the Upload page to preview and import it.
 
## Prerequisites
- Node.js 18+ and npm / pnpm
- PostgreSQL (local, Docker or hosted such as Supabase)
- Optional: Mailtrap or SMTP account for local email testing

## Environment variables
Create a `.env` file at the project root with at least the following values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payroll_db

# Admin credentials (single admin user stored via env vars)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=supersecret

# Email (SMTP fallback)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=smtp-user
SMTP_PASS=smtp-pass
SMTP_FROM="Payroll Team <no-reply@example.com>"
```

Notes:
- `DATABASE_URL` is read by Prisma via `prisma.config.ts`.

## Quickstart — Local development
1. Install dependencies:

```bash
npm install
```

2. Ensure PostgreSQL is running. Quick Docker command:

```bash
docker run --name payroll-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=payroll -p 5432:5432 -d postgres:15
```

3. Create `.env` (see above) and export `DATABASE_URL` pointing to the running DB.

4. Generate Prisma client and apply schema:

```bash
npx prisma generate
# If you want migrations (recommended for production):
npx prisma migrate dev --name init
# Or, for quick schema push without migrations:
npx prisma db push
```

5. Run the dev server:

```bash
npm run dev
# Open http://localhost:3000
```

6. Use the admin credentials from `.env` to sign in, navigate to Upload, and try uploading `sample-payroll.csv` included in the repo.

## Local email testing
- For local testing, configure any SMTP provider (Mailtrap, Gmail SMTP with App Passwords, etc.) using the SMTP environment variables.
- Use the employee ID from the uploaded record to open the generated PDF.
- Restart the development server after updating SMTP configuration.

## Live testing / Deployment
- Recommended: Deploy to Vercel. Configure DATABASE_URL, SMTP_*, ADMIN_EMAIL, and ADMIN_PASSWORD in the Vercel environment variables before deployment.
- Build & start commands are handled by Vercel (the repo's `build` script runs `prisma generate && next build`).
- If using a custom server or Docker, build the Next app and run `npm run start` after setting env variables.

## Database & Prisma notes
- Prisma's schema is at `prisma/schema.prisma`. The app expects a PostgreSQL datasource.
- Client is generated into `app/generated/prisma` by the `prisma generate` step.
- There are no checked-in migrations by default — run `npx prisma migrate dev` to create migrations for your database.

## Troubleshooting
- Startup fails with DB connection errors: verify `DATABASE_URL` and that Postgres is reachable.
- Email sending errors: check SMTP credentials. Examine server logs for provider error messages.
- PDF opening errors: confirm you are using the correct employee ID for the slip.
- Auth fails: verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` exist in `.env`.
