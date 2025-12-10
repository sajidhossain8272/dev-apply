# dev-apply

dev-apply is a developer-focused project that explores what a modern, automated job-hunting workflow could look like when it is built directly on top of the tools developers already use: GitHub, Next.js, and a simple, transparent backend.

Rather than being a closed, black-box job platform, dev-apply is designed as an open, understandable codebase that any programmer can read, run, and extend.

---

## What dev-apply is

dev-apply is:

- A **GitHub-first identity layer**  
  You sign in with GitHub, and that account becomes the single source of truth for your developer profile inside this system.

- A **structured profile and resume model**  
  Instead of a single PDF blob, your information is modeled as structured data:
  - User (identity, handle)
  - Profile (headline, bio, location, role, company, social links)
  - Experience entries
  - Project entries
  - Skills
  - Availability / “open to work” settings

- A **one-page public portfolio site per developer**  
  Every user can publish a simple, fast, SEO-friendly portfolio at a stable URL like:
  - `/u/[handle]` (e.g. `/u/sajidhossain`)

  The page focuses on clarity and readability:
  - Name, headline, and availability at the top.
  - About section from your bio.
  - Experience and projects in a clean, scrollable layout.
  - Skills as compact tags.
  - Links to GitHub, LinkedIn, personal site, and Twitter/X.

- A **foundation for automation and AI**  
  The current version is an MVP, but the data model and architecture are chosen so that later it can:
  - Pull signals from GitHub (repos, activity) to enrich your profile.
  - Match your skills and history against job and project descriptions.
  - Generate tailored cover letters and application emails.
  - Respect your status (for example “actively looking” vs “booked on a project”) when suggesting new opportunities.

---

## Why dev-apply exists

The idea behind dev-apply is that developers:

- Already maintain most of their “professional identity” in GitHub, code, and side projects.
- Should not have to repeatedly rewrite the same experience and skills in dozens of different ATS forms.
- Should be able to own and export their own profile data easily.
- Should have a public portfolio that is:
  - Minimal
  - Fast
  - Easy to keep in sync with what they are actually doing.

dev-apply tries to bring these pieces together in a small, comprehensible codebase that can be:

- Used as-is by individual developers.
- Forked and customized as a personal or team tool.
- Extended into a more complete AI-assisted job-hunting product.

---

## What dev-apply is not (yet)

At this MVP stage, dev-apply is not:

- A full job board or marketplace.
- A complete ATS replacement.
- A polished end-user SaaS.

Instead, it is intentionally kept small and direct:

- A clear data model for a developer’s professional profile.
- A GitHub-based sign-in flow.
- A private dashboard to manage that profile.
- A public portfolio route that turns that data into a single, shareable page.

This scope makes the project easier to understand, easier to extend, and a practical base for experimentation with automation, AI, and integrations in future iterations.

---

## Summary

dev-apply is a minimal, code-first approach to developer profiles and portfolios:

- GitHub sign-in.
- Structured profile and resume data.
- One-page public portfolio per handle.
- A foundation for automated, personalized job applications.

It is built for programmers who want both a working tool and a codebase they can learn from and modify.
