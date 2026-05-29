# Payroll Automation System 📄

Payroll Automation System is a Next.js (App Router + TypeScript) application to ingest payroll CSV/XLSX files, generate PDF salary slips, and dispatch them to employees via email.

## 🚀 Live Demo

The application is deployed and available for evaluation:

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
- **PDF generation:** pdf-lib
- **Validation:** Zod

## Key features
- Upload CSV / Excel payroll files (bulk employee salary rows)
- Validate and preview parsed rows before processing
- Generate per-employee PDF salary slips
- Send salary slips by email
- Bulk email dispatch with per-recipient status tracking
- Track upload, slip and email statuses in the database
- Branding settings for company name/address shown in emails and PDFs

## Application flow (how to use)
Follow this flow to evaluate the app quickly. Each step maps to pages in the dashboard.

1. Prepare your payroll file
	- Use the included `sample-payroll.csv` as the canonical format. The app expects these exact headers (case-insensitive):
	  - `employee_id`, `name`, `email`, `designation`, `base_salary`, `hra`, `allowances`, `deductions`, `month`, `year`
	- All numeric fields must be non-negative. `month` must be 1–12 and `year` should be in a reasonable range (e.g., 2022–2100).
	- Files with duplicate `employee_id` values or inconsistent month/year across rows will be rejected; fix the source CSV and re-upload.

2. Upload & preview
	- Go to the **Upload** page in the dashboard and choose your CSV/XLSX file.
	- The app parses and validates each row and shows a preview. Rows with validation errors are reported with row numbers and messages — fix those errors in your source file and re-upload.
	- When the preview looks correct, import the file into the system. The import creates a `Payroll Upload` record and one `SalaryRecord` per valid row.

3. Generate PDFs
	- After import, open the payroll upload details or the Payroll list to generate salary slips for imported rows.
	- The system uses your Branding settings (company name, address) to populate the PDF.

4. Edit PDF / Branding settings (IMPORTANT)
	- To change the company name, address, or other branding options, go to **Settings → Branding** and update the fields.
	- IMPORTANT: Changes to branding or the PDF template do NOT retroactively update already-generated PDFs. After changing settings, **regenerate the PDFs** for the relevant upload/records so the updated branding appears in the PDF and email body.

5. Send emails (bulk and individual)
	- Individual send: Select the **Mail** action for the corresponding employee from the Upload detail view.
	- Bulk send: Use the **Send all Emails** button from the Upload detail view. The UI shows per-recipient status and records each attempt in `EmailLog`.
	- The application uses SMTP via Nodemailer for salary slip delivery.

6. Monitor history and retry
	- Visit the **History** page to see past uploads, generated slips, and email dispatch attempts.
	- For failed emails, use the retry action from the dashboard to reattempt delivery of failed email dispatches.

7. Download or view PDF
	- Generated PDFs can be downloaded from the slip detail view for offline archiving.

Quick evaluator checklist:
 - Visit the live demo (https://payroll-automation-system-alpha.vercel.app/) and sign in with the demo credentials (username: `admin@example.com`, Password: `admin@1234`).
 
 <br>

 - **Optional**: Replace the sample employee email addresses with email addresses you can access. Multiple employee records may share the same email address during testing, making it easy to verify email delivery, PDF attachments, bulk dispatch functionality, and per-recipient status tracking.
 
 <br>

 - Upload `sample-payroll.csv`, import and generate PDFs.
 - Edit Branding in Settings, then regenerate a PDF to see the change.
 - Try sending one slip to yourself (individual send) and then perform a bulk send.
 - Check the History page for send status and retry failures from the dashboard.
 
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

# Next.js
NODE_ENV=development
PORT=3000
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
- Restart the development server after updating SMTP configuration.

## Live testing / Deployment
- Recommended: Deploy to Vercel. Configure DATABASE_URL, SMTP_*, ADMIN_EMAIL, and ADMIN_PASSWORD in the Vercel environment variables before deployment.
- Build & start commands are handled by Vercel (the repo's `build` script runs `prisma generate && next build`).
- If using a custom server or Docker, build the Next app and run `npm run start` after setting env variables.

## Database & Prisma notes
- Prisma's schema is at `prisma/schema.prisma`. The app expects a PostgreSQL datasource.
- Client is generated into `app/generated/prisma` by the `prisma generate` step.
- There are no checked-in migrations by default — run `npx prisma migrate dev` to create migrations for your database.

## Samples & testing data
- `sample-payroll.csv` is included for quick manual testing. Use the Upload page to preview and import them.

## Troubleshooting
- Startup fails with DB connection errors: verify `DATABASE_URL` and that Postgres is reachable.
- Email sending errors: check SMTP credentials. Examine server logs for provider error messages.
- Auth fails: verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` exist in `.env`.

## Development tips
- Use Mailtrap for safe email testing.
- `lib/pdf.ts` and `lib/email.ts` contain the PDF generation and email sending logic if you need to extend or customize attachments and templates.

