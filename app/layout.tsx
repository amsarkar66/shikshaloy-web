import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="font-[family-name:var(--font-figtree)] antialiased">
        <ThemeProvider>
          <SmoothScroll />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
