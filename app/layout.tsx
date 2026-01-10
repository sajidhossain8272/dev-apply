// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "dev-apply – effortless resume & portfolio for developers",
  description:
    "Generate an ATS-friendly resume and minimalist portfolio from your GitHub in seconds, then let automation help you apply to jobs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans transition-colors duration-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
