import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/smooth-scroll";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Shikshaloy — Modern School Management",
  description: "The complete platform for modern schools. Manage students, teachers, parents, fees, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${figtree.variable} font-[family-name:var(--font-figtree)] antialiased`}>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
