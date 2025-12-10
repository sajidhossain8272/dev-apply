import { z } from "zod";
const UrlField = z.string().url().or(z.literal("")).optional();

export const ExperienceInputSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean(),
  description: z.string().optional(),
});

export const ProjectInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  highlight: z.boolean().optional(),
  techStack: z.string().optional(),
});

export const SkillInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  level: z.string().optional(),
});

export const ProfileInputSchema = z.object({
  name: z.string().min(1),
  handle: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/i, "Only letters, numbers and dashes allowed"),
  headline: z.string().optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().optional(),
  currentCompany: z.string().optional(),
  currentRole: z.string().optional(),
  availability: z.enum(["OPEN", "BUSY", "NOT_LOOKING"]),
 links: z.object({
    github:   UrlField,
    linkedin: UrlField,
    website:  UrlField,
    twitter:  UrlField,
  }),
  experiences: z.array(ExperienceInputSchema),
  projects: z.array(ProjectInputSchema),
  skills: z.array(SkillInputSchema),
});
