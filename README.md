# Payroll Automation System

Payroll Automation System is a [Next.js](https://nextjs.org) application for ingesting payroll CSV and Excel files, generating salary slips, and dispatching them by email.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Local Email Testing With Mailtrap

This app sends email through Nodemailer over SMTP, so Mailtrap works without code changes.

1. Create a Mailtrap inbox and open its SMTP settings.
2. Copy the sandbox credentials into your local `.env` file:

```env
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-mailtrap-username"
SMTP_PASS="your-mailtrap-password"
SMTP_FROM="Payroll Team <no-reply@yourcompany.com>"
```

3. Keep `SMTP_FROM` as any friendly sender name/address you want to show in the message header.
4. Restart `npm run dev` so Next.js picks up the new env values.
5. Upload payroll data, generate slips, and click the email dispatch action. The messages will appear in Mailtrap's inbox instead of going to real recipients.

If sending fails, check the server log for the SMTP error message. The app requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` to be present before it can send.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
