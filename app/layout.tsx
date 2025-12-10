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
      <body className="bg-slate-950 text-slate-50">
        <Providers>
          <SiteHeader />
          <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
