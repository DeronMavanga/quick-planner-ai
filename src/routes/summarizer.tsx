import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Panel } from "@/components/AppShell";
import { followUpEmail, summarizeNotes } from "@/lib/ai.functions";
import { useLastEmail, useLastSummary, useTasks } from "@/lib/store";

export const Route = createFileRoute("/summarizer")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Kinetix Guest" },
      {
        name: "description",
        content:
          "Paste meeting notes or a transcript to extract key points, decisions, action items with owners, deadlines and open questions.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — Kinetix Guest" },
      {
        property: "og:description",
        content: "Turn raw meeting notes into decisions, owners and action items in seconds.",
      },
    ],
  }),
  component: SummarizerPage,
});

function SummarizerPage() {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useLastSummary();
  const [, setLastEmail] = useLastEmail();
  const { addTasks } = useTasks();
  const navigate = useNavigate();

  const summarize = useServerFn(summarizeNotes);
  const followUp = useServerFn(followUpEmail);

  const run = useMutation({
    mutationFn: (text: string) => summarize({ data: { notes: text } }),
    onSuccess: (data) => setSummary({ ...data, notes, savedAt: new Date().toISOString() }),
  });

  const draft = useMutation({
    mutationFn: () =>
      followUp({
        data: {
          decisions: summary?.decisions ?? [],
          actionItems: (summary?.actionItems ?? []).map(
            (a) => `${a.task}${a.owner ? ` (${a.owner})` : ""}${a.deadline ? ` — ${a.deadline}` : ""}`,
          ),
          tone: "professional",
        },
      }),
    onSuccess: (data) => {
      setLastEmail({ ...data, tone: "professional", savedAt: new Date().toISOString() });
      toast.success("Follow-up email drafted");
      navigate({ to: "/email" });
    },
  });

  return (
    <AppShell
      title="Meeting Notes Summarizer"
      intro="Paste notes, a transcript or raw text. Nothing is invented — owners and deadlines only appear when they're stated."
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Panel label="Notes">
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={16}
              placeholder="Paste your meeting notes or transcript here…"
              className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                {run.isPending ? "Reading the notes…" : `${notes.trim().split(/\s+/).filter(Boolean).length} words`}
              </span>
              <button
                disabled={notes.trim().length < 10 || run.isPending}
                onClick={() => run.mutate(notes)}
                className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary disabled:opacity-40"
              >
                Summarize
              </button>
            </div>
            {run.isError && (
              <p className="text-xs text-destructive">
                {(run.error as Error).message || "Summarizing failed. Try again."}
              </p>
            )}
          </div>
        </Panel>

        <Panel
          label="Summary"
          action={
            summary ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Saved locally
              </span>
            ) : undefined
          }
        >
          {!summary ? (
            <p className="text-sm text-muted-foreground">
              Key points, decisions, action items, deadlines and open questions land here.
            </p>
          ) : (
            <div className="space-y-6">
              <Bullets title="Key discussion points" items={summary.keyPoints} />
              <Bullets title="Decisions" items={summary.decisions} />

              {summary.actionItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Action items</h3>
                    <button
                      onClick={() => {
                        const n = addTasks(
                          summary.actionItems.map((a) => ({
                            title: a.task,
                            priority: a.priority,
                            ...(a.owner ? { owner: a.owner } : {}),
                            ...(/^\d{4}-\d{2}-\d{2}$/.test(a.deadline) ? { due: a.deadline } : {}),
                            ...(a.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(a.deadline)
                              ? { detail: `Deadline: ${a.deadline}` }
                              : {}),
                          })),
                        );
                        toast.success(`${n} task${n === 1 ? "" : "s"} added to the planner`);
                      }}
                      className="rounded border border-primary/20 px-2 py-1 text-[10px] font-semibold text-primary uppercase"
                    >
                      Send all to planner
                    </button>
                  </div>
                  <div className="space-y-2">
                    {summary.actionItems.map((a, i) => (
                      <div
                        key={`${a.task}-${i}`}
                        className="group flex items-center justify-between rounded p-2 transition-colors hover:bg-foreground/[0.02]"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{a.task}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {a.owner ? `Owner: ${a.owner}` : "Owner: not stated"}
                            {a.deadline ? ` • Deadline: ${a.deadline}` : ""} • {a.priority} priority
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            addTasks([
                              {
                                title: a.task,
                                priority: a.priority,
                                ...(a.owner ? { owner: a.owner } : {}),
                                ...(/^\d{4}-\d{2}-\d{2}$/.test(a.deadline) ? { due: a.deadline } : {}),
                              },
                            ]);
                            toast.success("Added to planner");
                          }}
                          className="rounded border border-primary/20 px-2 py-1 text-[10px] font-semibold text-primary uppercase opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          Add to planner
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Bullets title="Deadlines" items={summary.deadlines} />
              <Bullets title="Unresolved questions" items={summary.openQuestions} />

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  {draft.isPending ? "Writing follow-up…" : "From decisions and action items"}
                </span>
                <button
                  disabled={draft.isPending}
                  onClick={() => draft.mutate()}
                  className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary disabled:opacity-40"
                >
                  Draft follow-up email
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={`${item}-${i}`} className="flex items-start gap-3 text-sm text-pretty">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
