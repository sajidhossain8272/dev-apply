import { NextResponse } from "next/server";

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const body = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
