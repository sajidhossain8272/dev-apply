/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResumeView, ResumeData } from "@/components/resume/ResumeView";
import { SiteHeader } from "@/components/layout/SiteHeader";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string; variant: string }>;
};

async function getResumeBySlug(slug: string) {
  return prisma.resume.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          handle: true,
        },
      },
    },
  });
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug, variant } = await props.params;
  const resume = await getResumeBySlug(slug);

  if (!resume || !resume.isPublic) {
    return { title: "Resume Not Found" };
  }

  const content = resume.content as ResumeData;
  const name = content.name || resume.user.name || "Developer";
  const variantTitle = variant === "minimal" || variant === "compact" ? "Compact Minimalist" : "Modern Tech Standard";
  const title = `${name} – ${variantTitle} Resume`;

  return {
    title,
    description: content.summary || `Professional resume of ${name}`,
    openGraph: {
      title,
      description: content.summary || `Responsive, printable resume of ${name}`,
      type: "website",
    },
  };
}

export default async function PublicResumeVariantPage(props: PageProps) {
  const { slug, variant } = await props.params;
  const resume = await getResumeBySlug(slug);

  if (!resume || !resume.isPublic) {
    notFound();
  }

  const content = resume.content as ResumeData;
  const v = (variant || "").toLowerCase();
  const style: "SAJID_STANDARD" | "MEHRAB_MINIMAL" =
    v === "minimal" || v === "compact" || v === "mehrab_minimal"
      ? "MEHRAB_MINIMAL"
      : "SAJID_STANDARD";

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-black">
      <div className="print:hidden">
        <SiteHeader />
      </div>

      <main className="py-6">
        <div className="max-w-4xl mx-auto px-4 print:p-0">
          <ResumeView
            data={content}
            style={style}
            isPublicView={true}
          />
        </div>
      </main>
    </div>
  );
}
