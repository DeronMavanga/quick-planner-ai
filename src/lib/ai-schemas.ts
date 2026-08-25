import { z } from "zod";

export const TONES = [
  "professional",
  "friendly",
  "concise",
  "persuasive",
  "apologetic",
  "formal",
] as const;

export type Tone = (typeof TONES)[number];

export const EmailInput = z.object({
  instructions: z.string().min(3),
  tone: z.enum(TONES),
  recipient: z.string().optional(),
});

export const SummaryInput = z.object({
  notes: z.string().min(10),
});

export const PlanInput = z.object({
  goals: z.string().min(3),
  horizon: z.string().optional(),
});

export const FollowUpInput = z.object({
  decisions: z.array(z.string()),
  actionItems: z.array(z.string()),
  tone: z.enum(TONES),
});

export type EmailResult = {
  subject: string;
  body: string;
  shortVersion: string;
  missingInfo: string[];
};

export type ActionItem = {
  task: string;
  owner: string;
  deadline: string;
  priority: "high" | "medium" | "low";
};

export type SummaryResult = {
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  deadlines: string[];
  openQuestions: string[];
};

export type PlanResult = {
  tasks: {
    title: string;
    detail: string;
    due: string;
    priority: "high" | "medium" | "low";
    estimate: string;
  }[];
  schedule: { when: string; focus: string }[];
  clarifyingQuestions: string[];
};
