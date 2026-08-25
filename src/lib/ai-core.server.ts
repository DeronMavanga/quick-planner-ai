import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import type { EmailResult, PlanResult, SummaryResult, Tone } from "./ai-schemas";

const MODEL = "google/gemini-3.7-flash";

const BASE_RULES = `You are a precise productivity assistant.
Rules:
- Be concise, accurate and practical.
- Never invent facts, names, deadlines, decisions or commitments that are not in the input.
- Preserve the user's original intent and improve grammar and clarity.
- If essential information is missing, say so explicitly in the dedicated field instead of guessing.
- Leave a field as an empty string or empty array when the input does not support it.`;

function gateway() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
}

async function run<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const provider = gateway();
  try {
    const result = streamText({
      model: provider(MODEL),
      system: `${BASE_RULES}\n\n${system}`,
      prompt,
      output: Output.object({ schema }),
    });
    return (await result.output) as T;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      const match = error.text.match(/\{[\s\S]*\}/);
      if (match) return schema.parse(JSON.parse(match[0]));
    }
    throw error;
  }
}

const emailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  shortVersion: z.string(),
  missingInfo: z.array(z.string()),
});

const summarySchema = z.object({
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string(),
      deadline: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    }),
  ),
  deadlines: z.array(z.string()),
  openQuestions: z.array(z.string()),
});

const planSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      due: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      estimate: z.string(),
    }),
  ),
  schedule: z.array(z.object({ when: z.string(), focus: z.string() })),
  clarifyingQuestions: z.array(z.string()),
});

export async function runEmail(input: {
  instructions: string;
  tone: Tone;
  recipient?: string;
}): Promise<EmailResult> {
  return run(
    emailSchema,
    `Write a single email in a ${input.tone} tone. Suggest a specific subject line.
Body: clear paragraphs, no markdown headings, no placeholder brackets unless the user left a real gap.
shortVersion: a meaningfully shorter variant of the same email (2-4 sentences).
missingInfo: only genuinely essential facts the user must supply.`,
    `Recipient: ${input.recipient || "not specified"}\nInstructions:\n${input.instructions}`,
  );
}

export async function runSummary(notes: string): Promise<SummaryResult> {
  return run(
    summarySchema,
    `Summarize the meeting notes/transcript. Extract key discussion points, decisions,
action items (owner only if a person is explicitly named, otherwise empty string;
deadline only if explicitly stated, otherwise empty string), deadlines, and unresolved questions.
Keep each bullet to one scannable sentence.`,
    notes,
  );
}

export async function runPlan(goals: string, horizon?: string): Promise<PlanResult> {
  const today = new Date().toISOString().slice(0, 10);
  return run(
    planSchema,
    `Turn the goals into an actionable plan. Break large goals into smaller concrete tasks.
Prioritize by urgency and importance. "due" must be an ISO date (YYYY-MM-DD) when a date can be
derived from the input or the horizon, otherwise an empty string. "estimate" is a short duration
like "45m" or "2h". "schedule" is a realistic sequence of work blocks.
clarifyingQuestions: only essential missing information.
Today is ${today}.`,
    `Horizon: ${horizon || "not specified"}\nGoals and tasks:\n${goals}`,
  );
}
