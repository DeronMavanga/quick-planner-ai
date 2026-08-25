import { createServerFn } from "@tanstack/react-start";
import { EmailInput, FollowUpInput, PlanInput, SummaryInput } from "./ai-schemas";

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => EmailInput.parse(data))
  .handler(async ({ data }) => {
    const { runEmail } = await import("./ai-core.server");
    return runEmail(data);
  });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SummaryInput.parse(data))
  .handler(async ({ data }) => {
    const { runSummary } = await import("./ai-core.server");
    return runSummary(data.notes);
  });

export const buildPlan = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PlanInput.parse(data))
  .handler(async ({ data }) => {
    const { runPlan } = await import("./ai-core.server");
    return runPlan(data.goals, data.horizon);
  });

export const followUpEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => FollowUpInput.parse(data))
  .handler(async ({ data }) => {
    const { runEmail } = await import("./ai-core.server");
    const instructions = [
      "Write a follow-up email recapping the meeting outcome.",
      data.decisions.length ? `Decisions:\n- ${data.decisions.join("\n- ")}` : "",
      data.actionItems.length ? `Action items:\n- ${data.actionItems.join("\n- ")}` : "",
      "Do not add anything that is not listed above.",
    ]
      .filter(Boolean)
      .join("\n\n");
    return runEmail({ instructions, tone: data.tone });
  });
