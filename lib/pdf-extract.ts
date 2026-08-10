/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extract text content from a PDF file using PDF.js (pdfjs-dist).
 * This runs client-side in the browser.
 *
 * NOTE: The worker is loaded from the local /public directory to avoid
 * CDN fetch failures (e.g. "Failed to fetch dynamically imported module").
 * Run `npm run copy-pdf-worker` after installing/updating pdfjs-dist.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamic import to avoid SSR issues and keep bundle split
  const pdfjsLib = await import("pdfjs-dist");

  // Use the locally-served worker file from /public to avoid CDN issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText.trim();
}