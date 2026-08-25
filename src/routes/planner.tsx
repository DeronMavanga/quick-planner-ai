import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { buildPlan } from "@/lib/ai.functions";
import type { PlanResult } from "@/lib/ai-schemas";
import { TaskBoard } from "@/components/TaskBoard";
import { useTasks } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Planner — Kinetix Guest" },
      {
        name: "description",
        content:
          "Turn goals and deadlines into a prioritized plan with realistic schedules, and see overdue, high-priority and upcoming tasks at a glance.",
      },
      { property: "og:title", content: "AI Planner — Kinetix Guest" },
      {
        property: "og:description",
        content: "Break goals into prioritized tasks with realistic schedules. No account needed.",
      },
    ],
  }),
  component: PlannerPage,
});

function PlannerPage() {
  const [goals, setGoals] = useState("");
  const [horizon, setHorizon] = useState("");
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const { addTasks } = useTasks();
  const fn = useServerFn(buildPlan);

  const mutation = useMutation({
    mutationFn: () =>
      fn({ data: { goals, ...(horizon.trim() ? { horizon: horizon.trim() } : {}) } }),
    onSuccess: (data) => setPlan(data),
  });

  return (
    <AppShell
      title="Daily Planner"
      intro="Describe your goals, deadlines and priorities. Tasks are grouped by what's overdue, urgent and upcoming."
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Panel label="Goals">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Timeframe (optional)</label>
              <input
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                placeholder="This week"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={10}
              placeholder="Ship the onboarding redesign, prepare the Q3 board deck by Friday, and clear the support backlog."
              className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                {mutation.isPending ? "Building the plan…" : "Tasks are saved in this browser."}
              </span>
              <button
                disabled={goals.trim().length < 3 || mutation.isPending}
                onClick={() => mutation.mutate()}
                className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary disabled:opacity-40"
              >
                Build plan
              </button>
            </div>
            {mutation.isError && (
              <p className="text-xs text-destructive">
                {(mutation.error as Error).message || "Planning failed. Try again."}
              </p>
            )}
          </div>
        </Panel>

        <Panel label="Proposed plan">
          {!plan ? (
            <p className="text-sm text-muted-foreground">
              A prioritized task breakdown and a suggested schedule will appear here.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                {plan.tasks.map((t, i) => (
                  <div key={`${t.title}-${i}`} className="rounded-lg p-3 ring-1 ring-border">
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.detail && (
                      <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{t.detail}</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {t.priority} priority{t.due ? ` • due ${t.due}` : ""}
                      {t.estimate ? ` • ${t.estimate}` : ""}
                    </p>
                  </div>
                ))}
              </div>

              {plan.schedule.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-medium">Suggested schedule</h3>
                  <ul className="space-y-1.5">
                    {plan.schedule.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="w-28 shrink-0 text-muted-foreground">{s.when}</span>
                        <span className="text-pretty">{s.focus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.clarifyingQuestions.length > 0 && (
                <div className="rounded-md bg-primary/5 p-3 ring-1 ring-primary/10">
                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-primary uppercase">
                    Needs your input
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {plan.clarifyingQuestions.map((q) => (
                      <li key={q}>• {q}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end border-t border-border pt-4">
                <button
                  onClick={() => {
                    const n = addTasks(
                      plan.tasks.map((t) => ({
                        title: t.title,
                        priority: t.priority,
                        ...(t.detail ? { detail: t.detail } : {}),
                        ...(/^\d{4}-\d{2}-\d{2}$/.test(t.due) ? { due: t.due } : {}),
                        ...(t.estimate ? { estimate: t.estimate } : {}),
                      })),
                    );
                    toast.success(`${n} task${n === 1 ? "" : "s"} added`);
                  }}
                  className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary"
                >
                  Add all to my tasks
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <TaskBoard label="My tasks" editable />
    </AppShell>
  );
}
