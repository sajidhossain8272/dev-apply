/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";

/**
 * Generate a professional PDF Buffer for a Cover Letter
 */
export function generateCoverLetterPdfBuffer(params: {
  text: string;
  candidateName?: string;
  jobTitle?: string;
  company?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Header - Candidate Name
    if (params.candidateName) {
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor("#111827")
        .text(params.candidateName.toUpperCase(), { align: "left" });
      doc.moveDown(0.2);
    }

    if (params.jobTitle || params.company) {
      const sub = `Application for ${params.jobTitle || "Position"}${params.company ? ` at ${params.company}` : ""}`;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#4B5563")
        .text(sub);
      doc.moveDown(0.5);
    }

    // Divider Line
    doc
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1.5);

    // Body Content
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#1F2937")
      .lineGap(5)
      .text(params.text || "Dear Hiring Manager,\n\nPlease accept this cover letter...", {
        align: "left",
        paragraphGap: 10,
      });

    doc.end();
  });
}

/**
 * Generate a clean ATS-friendly PDF Buffer for a Resume
 */
export function generateResumePdfBuffer(content: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    const name = content?.name || "Candidate";
    const headline = content?.headline || "";
    const contact = content?.contact || {};
    const summary = content?.summary || "";
    const skills = content?.skills || [];
    const experiences = content?.experiences || [];
    const projects = content?.projects || [];
    const education = content?.education || [];

    // Header Name
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#0F172A")
      .text(name.toUpperCase());

    if (headline) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#0D9488")
        .text(headline);
      doc.moveDown(0.2);
    }

    // Contact info bar
    const contactItems: string[] = [];
    if (contact.email) contactItems.push(contact.email);
    if (contact.phone) contactItems.push(contact.phone);
    if (contact.location) contactItems.push(contact.location);
    if (contact.github) contactItems.push(contact.github);
    if (contact.linkedin) contactItems.push(contact.linkedin);

    if (contactItems.length > 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text(contactItems.join("  |  "));
      doc.moveDown(0.4);
    }

    // Divider
    doc
      .strokeColor("#CBD5E1")
      .lineWidth(1)
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .stroke();
    doc.moveDown(0.8);

    // Summary Section
    if (summary) {
      renderSectionHeader(doc, "PROFESSIONAL SUMMARY");
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#334155")
        .lineGap(3)
        .text(summary);
      doc.moveDown(0.8);
    }

    // Skills Section
    if (skills && skills.length > 0) {
      renderSectionHeader(doc, "TECHNICAL SKILLS");
      for (const cat of skills) {
        if (typeof cat === "string") {
          doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(`• ${cat}`);
        } else if (cat.category && cat.items) {
          const itemsStr = Array.isArray(cat.items) ? cat.items.join(", ") : cat.items;
          doc
            .font("Helvetica-Bold")
            .fontSize(9.5)
            .fillColor("#1E293B")
            .text(`${cat.category}: `, { continued: true })
            .font("Helvetica")
            .fillColor("#334155")
            .text(itemsStr);
        } else if (cat.name) {
          doc
            .font("Helvetica")
            .fontSize(9.5)
            .fillColor("#334155")
            .text(`• ${cat.name} (${cat.level || "Proficient"})`);
        }
      }
      doc.moveDown(0.8);
    }

    // Work Experience
    if (experiences && experiences.length > 0) {
      renderSectionHeader(doc, "WORK EXPERIENCE");
      for (const exp of experiences) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10.5)
          .fillColor("#0F172A")
          .text(exp.title || "Position", { continued: true })
          .font("Helvetica")
          .fillColor("#475569")
          .text(`  at ${exp.company || ""}`);

        if (exp.startDate) {
          const dates = `${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate || ""}`;
          doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#64748B").text(dates);
        }

        if (exp.description) {
          doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(exp.description);
        }

        if (exp.bullets && Array.isArray(exp.bullets)) {
          for (const bullet of exp.bullets) {
            doc
              .font("Helvetica")
              .fontSize(9)
              .fillColor("#334155")
              .text(`  •  ${bullet}`, { lineGap: 2 });
          }
        }
        doc.moveDown(0.5);
      }
      doc.moveDown(0.3);
    }

    // Projects
    if (projects && projects.length > 0) {
      renderSectionHeader(doc, "KEY PROJECTS");
      for (const p of projects) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#0F172A")
          .text(p.name);

        if (p.techStack) {
          doc.font("Helvetica-Oblique").fontSize(8.5).fillColor("#0D9488").text(`Technologies: ${p.techStack}`);
        }

        if (p.description) {
          doc.font("Helvetica").fontSize(9).fillColor("#334155").text(p.description);
        }

        if (p.bullets && Array.isArray(p.bullets)) {
          for (const bullet of p.bullets) {
            doc.font("Helvetica").fontSize(9).fillColor("#334155").text(`  •  ${bullet}`);
          }
        }
        doc.moveDown(0.4);
      }
    }

    doc.end();
  });
}

function renderSectionHeader(doc: any, title: string) {
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#0F172A")
    .text(title.toUpperCase());
  doc
    .strokeColor("#94A3B8")
    .lineWidth(0.5)
    .moveTo(40, doc.y + 2)
    .lineTo(555, doc.y + 2)
    .stroke();
  doc.moveDown(0.5);
}
