import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s — PaySlip Pro",
    default: "PaySlip Pro — Salary Slip Automation",
  },
  description:
    "Admin dashboard for generating and dispatching employee salary slips via email.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
