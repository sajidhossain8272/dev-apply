/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { extractProfileFromWebText } from "@/lib/gemini";

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url, rawText } = body;

    let textContent = rawText || "";

    if (url) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (res.ok) {
          const html = await res.text();
          const cleanText = stripHtml(html);
          textContent = `${textContent}\n${cleanText}`;
        } else {
          console.warn(`[URL Fetch Warning] Failed to fetch ${url}, status: ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`[URL Fetch Error] Failed to fetch ${url}:`, err.message);
      }
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { error: "No text content found at URL or in provided text." },
        { status: 400 }
      );
    }

    const extracted = await extractProfileFromWebText(textContent);

    return NextResponse.json({ success: true, extracted });
  } catch (error: any) {
    console.error("Error extracting external portfolio data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract external portfolio data" },
      { status: 500 }
    );
  }
}
