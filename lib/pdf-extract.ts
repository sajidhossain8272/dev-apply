/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extract text content from a PDF file using PDF.js (pdfjs-dist).
 * This runs client-side in the browser.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamic import to avoid SSR issues and keep bundle split
  const pdfjsLib = await import("pdfjs-dist");

  // Configure the worker from CDN (matches the installed version)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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