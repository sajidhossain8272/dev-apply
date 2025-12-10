export type AvailabilityStatus = "OPEN" | "BUSY" | "NOT_LOOKING";

export type ExperienceInput = {
  id?: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;          // ISO string (yyyy-mm-dd)
  endDate?: string | null;   // null if current
  isCurrent: boolean;
  description?: string;
};

export type ProjectInput = {
  id?: string;
  name: string;
  description?: string;
  url?: string;
  highlight?: boolean;
  techStack?: string;
};

export type SkillInput = {
  id?: string;
  name: string;
  level?: string;
};

export type ProfileInput = {
  name: string;
  handle: string;
  headline?: string;
  bio?: string;
  location?: string;
  currentCompany?: string;
  currentRole?: string;
  availability: AvailabilityStatus;
  links: {
    github?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
  experiences: ExperienceInput[];
  projects: ProjectInput[];
  skills: SkillInput[];
};
