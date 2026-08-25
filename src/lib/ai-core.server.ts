import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import type { EmailResult, PlanResult, SummaryResult, Tone } from "./ai-schemas";

const MODEL = "google/gemini-3.7-flash";

const BASE_RULES = `You are a precise productivity assistant.
Rules:
- Be concise, accurate and practical.
- Never invent facts, names, deadlines, decisions or commitments that are not in the input.
- Preserve the user's original intent and improve grammar and clarity.
- If essential information is missing, say so explicitly in the dedicated field instead of guessing.
- Always return EVERY field of the requested JSON shape. Use an empty string or an empty array when the input does not support a field; never omit a key.`;

function gateway() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
}

async function run<S extends z.ZodTypeAny>(
  schema: S,
  system: string,
  prompt: string,
): Promise<z.infer<S>> {
  const provider = gateway();
  try {
    const result = await generateText({
      model: provider(MODEL),
      system: `${BASE_RULES}\n\n${system}`,
      prompt,
      output: Output.object({ schema }),
    });
    return result.output as z.infer<S>;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      const match = error.text.match(/\{[\s\S]*\}/);
      if (match) return schema.parse(JSON.parse(match[0])) as z.infer<S>;
    }
    throw error;
  }
}

const str = z.string().optional().default("");
const list = z.array(z.string()).optional().default([]);

const emailSchema = z.object({
  subject: str,
  body: str,
  shortVersion: str,
  missingInfo: list,
});

const summarySchema = z.object({
  keyPoints: list,
  decisions: list,
  actionItems: z
    .array(
      z.object({
        task: str,
        owner: str,
        deadline: str,
        priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
      }),
    )
    .optional()
    .default([]),
  deadlines: list,
  openQuestions: list,
});

const planSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: str,
        detail: str,
        due: str,
        priority: z.enum(["high", "medium", "low"]).optional().default("medium"),
        estimate: str,
      }),
    )
    .optional()
    .default([]),
  schedule: z.array(z.object({ when: str, focus: str })).optional().default([]),
  clarifyingQuestions: list,
});

export async function runEmail(input: {
  instructions: string;
  tone: Tone;
  recipient?: string | undefined;
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
    `Summarize the meeting notes/transcript. Return ALL of these keys, every time:
- keyPoints: the main discussion points (always populate when there is any content).
- decisions: things that were explicitly decided.
- actionItems: every task someone is expected to do. owner only if a person is explicitly named,
  otherwise ""; deadline only if explicitly stated, otherwise "".
- deadlines: any dates or timeframes stated.
- openQuestions: unresolved questions.
Keep each bullet to one scannable sentence.`,

    notes,
  );
}

export async function runPlan(goals: string, horizon?: string | undefined): Promise<PlanResult> {
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
