import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({ src: "../public/landing/inter.woff2", variable: "--font-sans", weight: "100 900" });
const serif = localFont({
  src: "../public/landing/instrument-serif-italic.woff2",
  variable: "--font-serif",
  style: "italic",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Roleflow — AI job application workspace",
  description: "Find live roles, tailor your resume, and let a browser agent fill applications for your approval.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
