/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

export type ResumeData = {
  name?: string;
  headline?: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  summary?: string;
  skills?: {
    category: string;
    items: string[];
  }[];
  experiences?: {
    company: string;
    title: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    bullets?: string[];
  }[];
  projects?: {
    name: string;
    subtitle?: string;
    liveUrl?: string;
    repoUrl?: string;
    startDate?: string;
    endDate?: string;
    bullets?: string[];
  }[];
  education?: {
    degree: string;
    institution: string;
    year?: string;
    details?: string[];
  }[];
  additional?: {
    languages?: string;
    interests?: string;
  };
};

interface ResumeViewProps {
  data: ResumeData;
  style?: "SAJID_STANDARD" | "MEHRAB_MINIMAL";
  isPublicView?: boolean;
  onStyleChange?: (newStyle: "SAJID_STANDARD" | "MEHRAB_MINIMAL") => void;
  publicUrl?: string;
}

export function ResumeView({
  data,
  style = "SAJID_STANDARD",
  isPublicView = false,
  onStyleChange,
  publicUrl,
}: ResumeViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const isSajidStyle = style === "SAJID_STANDARD";

  return (
    <div className="resume-wrapper max-w-4xl mx-auto my-6 px-4">
      {/* Top Action Bar (Hidden during Print) */}
      {!isPublicView && (
        <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-300">Template Style:</span>
            <button
              onClick={() => onStyleChange?.("SAJID_STANDARD")}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                isSajidStyle
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Sajid Hossain (Standard)
            </button>
            <button
              onClick={() => onStyleChange?.("MEHRAB_MINIMAL")}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-colors ${
                !isSajidStyle
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              Mehrab Hossain (Low-Profile)
            </button>
          </div>

          <div className="flex items-center gap-3">
            {publicUrl && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  alert("Resume URL copied to clipboard!");
                }}
                className="px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Copy Link
              </button>
            )}
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-black bg-white rounded-lg hover:bg-neutral-200 shadow transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                ></path>
              </svg>
              Print / Download PDF
            </button>
          </div>
        </div>
      )}

      {/* Embedded Resume CSS Styles derived from Sajid & Mehrab templates */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: ${isSajidStyle ? "10mm 10mm 10mm 10mm" : "8mm 10mm 8mm 10mm"};
        }

        .resume-paper {
          font-family: Arial, Helvetica, sans-serif;
          background-color: #ffffff;
          color: #222222;
          line-height: ${isSajidStyle ? "1.3" : "1.25"};
          font-size: ${isSajidStyle ? "12px" : "11.5px"};
          padding: 30px 35px;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        @media print {
          html, body {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .resume-wrapper {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .resume-paper {
            box-shadow: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
            font-size: ${isSajidStyle ? "10.5px" : "9.5px"} !important;
            line-height: ${isSajidStyle ? "1.3" : "1.25"} !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          a {
            text-decoration: none !important;
            color: #1a0dab !important;
          }
        }

        .resume-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: ${isSajidStyle ? "16px" : "12px"};
        }

        .resume-name {
          color: #111111;
          font-size: ${isSajidStyle ? "28px" : "24px"};
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0 0 4px 0;
        }

        .resume-headline {
          font-size: ${isSajidStyle ? "13px" : "11.5px"};
          font-weight: 600;
          color: #444444;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .resume-contact {
          font-size: ${isSajidStyle ? "11px" : "10px"};
          color: #333333;
          margin-bottom: 12px;
        }
        .resume-contact p {
          margin: 2px 0;
        }
        .resume-contact a {
          color: #1a0dab;
          text-decoration: underline;
        }

        .resume-section {
          margin-bottom: ${isSajidStyle ? "12px" : "8px"};
          page-break-inside: avoid;
        }

        .resume-section-title {
          font-size: ${isSajidStyle ? "15px" : "13px"};
          color: #111111;
          font-weight: 700;
          border-bottom: 1px solid #dddddd;
          padding-bottom: 3px;
          margin: 0 0 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .resume-p {
          margin: 3px 0 6px 0;
        }

        .resume-ul {
          margin: 3px 0 6px 0;
          padding-left: ${isSajidStyle ? "16px" : "14px"};
        }

        .resume-li {
          margin-bottom: 3px;
        }

        .resume-meta {
          font-size: ${isSajidStyle ? "11px" : "10px"};
          color: #555555;
          margin: 1px 0 4px 0;
        }

        .resume-project-title {
          font-weight: 700;
          font-size: ${isSajidStyle ? "12px" : "11px"};
          margin: 6px 0 2px 0;
        }

        .resume-project-title a {
          font-weight: 400;
          font-size: ${isSajidStyle ? "11px" : "10px"};
          margin-left: 8px;
          color: #1a0dab;
          text-decoration: underline;
        }

        .resume-two-column {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
      `}</style>

      {/* Resume Document Paper */}
      <div className="resume-paper">
        {/* Header */}
        <div className="resume-header">
          <h1 className="resume-name">{data.name || "Developer Name"}</h1>
          {data.headline && <div className="resume-headline">{data.headline}</div>}

          <div className="resume-contact">
            {data.contact?.email || data.contact?.phone ? (
              <p>
                {data.contact?.email && (
                  <>
                    Email: <a href={`mailto:${data.contact.email}`}>{data.contact.email}</a>
                  </>
                )}
                {data.contact?.email && data.contact?.phone && " | "}
                {data.contact?.phone && <>Phone: {data.contact.phone}</>}
              </p>
            ) : null}

            {(data.contact?.location ||
              data.contact?.linkedin ||
              data.contact?.website ||
              data.contact?.github) && (
              <p>
                {data.contact?.location && <>Location: {data.contact.location}</>}
                {data.contact?.location && data.contact?.linkedin && " | "}
                {data.contact?.linkedin && (
                  <a href={data.contact.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                )}
                {(data.contact?.linkedin || data.contact?.location) && data.contact?.website && " | "}
                {data.contact?.website && (
                  <a href={data.contact.website} target="_blank" rel="noreferrer">
                    Portfolio
                  </a>
                )}
                {(data.contact?.website || data.contact?.linkedin || data.contact?.location) &&
                  data.contact?.github &&
                  " | "}
                {data.contact?.github && (
                  <a href={data.contact.github} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <section className="resume-section">
            <h2 className="resume-section-title">Professional Summary</h2>
            <p className="resume-p">{data.summary}</p>
          </section>
        )}

        {/* Technical Skills */}
        {data.skills && data.skills.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Technical Skills</h2>
            {data.skills.map((group, idx) => (
              <p className="resume-p" key={idx}>
                <strong>{group.category}:</strong> {group.items.join(", ")}
              </p>
            ))}
          </section>
        )}

        {/* Professional Experience */}
        {data.experiences && data.experiences.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Professional Experience</h2>
            {data.experiences.map((exp, idx) => (
              <div key={idx} style={{ marginBottom: "8px" }}>
                <p className="resume-p">
                  <strong>{exp.title}</strong> –{" "}
                  {exp.company}
                  {exp.location ? `, ${exp.location}` : ""}
                </p>
                <p className="resume-meta">
                  {exp.startDate} – {exp.isCurrent ? "Present" : exp.endDate || "Present"}
                </p>
                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="resume-ul">
                    {exp.bullets.map((b, i) => (
                      <li className="resume-li" key={i}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Key Projects */}
        {data.projects && data.projects.length > 0 && (
          <section className="resume-section">
            <h2 className="resume-section-title">Key Projects</h2>
            {data.projects.map((proj, idx) => (
              <div key={idx} style={{ marginBottom: "8px" }}>
                <div className="resume-project-title">
                  {proj.name}
                  {proj.subtitle ? ` – ${proj.subtitle}` : ""}
                  {proj.liveUrl && (
                    <a href={proj.liveUrl} target="_blank" rel="noreferrer">
                      View website
                    </a>
                  )}
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noreferrer">
                      View repository
                    </a>
                  )}
                </div>
                {(proj.startDate || proj.endDate) && (
                  <p className="resume-meta">
                    {proj.startDate} – {proj.endDate || "Present"}
                  </p>
                )}
                {proj.bullets && proj.bullets.length > 0 && (
                  <ul className="resume-ul">
                    {proj.bullets.map((b, i) => (
                      <li className="resume-li" key={i}>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Two Column Section for Education & Additional */}
        <div className="resume-two-column">
          {data.education && data.education.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-title">Education & Certifications</h2>
              {data.education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: "4px" }}>
                  <p className="resume-p">
                    <strong>{edu.degree}</strong> – {edu.institution}
                    {edu.year ? `, ${edu.year}` : ""}
                  </p>
                  {edu.details && edu.details.length > 0 && (
                    <ul className="resume-ul">
                      {edu.details.map((d, i) => (
                        <li className="resume-li" key={i}>
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {data.additional && (data.additional.languages || data.additional.interests) && (
            <section className="resume-section">
              <h2 className="resume-section-title">Additional Information</h2>
              {data.additional.languages && (
                <p className="resume-p">
                  <strong>Languages:</strong> {data.additional.languages}
                </p>
              )}
              {data.additional.interests && (
                <p className="resume-p">
                  <strong>Interests:</strong> {data.additional.interests}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
