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
> `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.

## Tech stack
- **Framework:** Next.js (App Router) + React
- **Language:** TypeScript
- **Database / ORM:** PostgreSQL + Prisma
- **Styling:** Tailwind CSS / PostCSS
- **Email:** Nodemailer (SMTP)

## Features
- Upload payroll data from CSV or Excel files
- Validate and preview employee records before processing
- Generate password-protected PDF salary slips
- Send salary slips via email individually or in bulk
- Track uploads, salary slips, and email delivery status
- Manage company branding for PDFs and email templates

## Application flow
(Quick evaluator checklist):

1. Sign in using the demo credentials.
2. **Optional:** Replace the sample employee email addresses with email addresses you can access. Multiple employees may use the same email address during testing to verify email delivery, PDF attachments, bulk dispatch, and status tracking.
3. Upload CSV/Excel payroll file with the format given in `sample-payroll.csv`
4. Generate salary slip PDFs.
5. Verify PDF password protection using the employee ID.
6. Update branding settings and **regenerate** a PDF.
7. Send salary slips individually or in bulk.
8. Review delivery status in the History page.

## Sample data
- `sample-payroll.csv` is included for providing the expected payroll format and for quick manual testing. Use the Upload page to preview and import it.
 
## Prerequisites
- Node.js 18+ and npm / pnpm
- PostgreSQL (local, Docker or hosted such as Supabase)
- Optional: Mailtrap or SMTP account for local email testing

## Quickstart — Local development
### 1. Clone the Repository
```bash
git clone <repository-url>
cd payroll-automation-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file:

```bash
cp .env.example .env
```
Set the .env values as shown [below](#environment-variables)

### 4. Setup the Database
Generate the Prisma client and apply the schema:

```bash
npx prisma generate
npx prisma db push
```

If using Supabase, obtain the PostgreSQL connection string from your project settings and set it as `DATABASE_URL`.

### 5. Start the Development Server
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 6. Sign In and Test
Use the admin credentials configured in `.env`, then upload the sample payroll file included in the repository to test the application.
Notes:
- `DATABASE_URL` is read by Prisma via `prisma.config.ts`.

## Environment variables
Create a `.env` file at the project root with at least the following values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payroll_db

# Admin credentials (single admin user stored via env vars)
ADMIN_EMAIL=your_admin_username
ADMIN_PASSWORD=your_admin_password
# Session key for HMAC session signing. Generate with: "openssl rand -hex 32"
SESSION_SECRET=replace_with_a_long_random_value

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=smtp-user
SMTP_PASS=smtp-pass
SMTP_FROM="Payroll Team <no-reply@example.com>"
```

## Database
The application uses PostgreSQL with Prisma ORM.

Generate the Prisma client and apply the schema using:

```bash
npx prisma generate
npx prisma db push
```

## Troubleshooting
- Startup fails with DB connection errors: verify `DATABASE_URL` and that Postgres is reachable.
- Email sending errors: check SMTP credentials. Examine server logs for provider error messages.
- PDF opening errors: confirm you are using the correct employee ID for the slip.
- Auth fails: verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` exist in `.env`.

