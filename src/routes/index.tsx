import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Panel } from "@/components/AppShell";
import { TaskBoard } from "@/components/TaskBoard";
import { useLastEmail, useLastSummary } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kinetix Guest — AI Productivity Workspace" },
      {
        name: "description",
        content:
          "Draft emails, summarize meeting notes and plan your work with AI. No sign-up, no account — everything stays in your browser.",
      },
      { property: "og:title", content: "Kinetix Guest — AI Productivity Workspace" },
      {
        property: "og:description",
        content: "AI email drafting, meeting summaries and planning. Guest mode, no account needed.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [summary] = useLastSummary();
  const [email] = useLastEmail();

  return (
    <AppShell
      title="Workspace Overview"
      intro="Three tools, no account. Drafts, summaries and tasks stay in this browser."
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Panel
          label="Summarizer"
          action={
            <Link
              to="/summarizer"
              className="text-[10px] font-semibold tracking-wider text-primary uppercase"
            >
              Open
            </Link>
          }
        >
          {!summary ? (
            <p className="text-sm text-muted-foreground">
              Paste meeting notes to pull out decisions, action items and open questions.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Original notes</label>
                <div className="line-clamp-3 rounded-md border border-border bg-foreground/[0.02] p-4 text-sm text-muted-foreground italic">
                  {summary.notes}
                </div>
              </div>
              {summary.decisions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-medium">Key decisions</h3>
                  <ul className="space-y-2">
                    {summary.decisions.slice(0, 3).map((d, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-pretty">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.actionItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-medium">Action items</h3>
                  {summary.actionItems.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex flex-col p-2">
                      <span className="text-sm font-medium">{a.task}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {a.owner ? `Owner: ${a.owner}` : "Owner: not stated"}
                        {a.deadline ? ` • Deadline: ${a.deadline}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel
          label="Email Generator"
          action={
            <Link
              to="/email"
              className="text-[10px] font-semibold tracking-wider text-primary uppercase"
            >
              Open
            </Link>
          }
        >
          {!email ? (
            <p className="text-sm text-muted-foreground">
              Describe what you need to say and get a subject line, a full draft and a shorter version.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Subject
                </span>
                <p className="text-sm font-medium">{email.subject}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Body
                </span>
                <div className="line-clamp-[10] max-w-[48ch] text-sm leading-relaxed whitespace-pre-wrap text-pretty">
                  {email.body}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground capitalize">{email.tone} tone</span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
                  }
                  className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary"
                >
                  Copy draft
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <TaskBoard label="Daily Planner" />
    </AppShell>
  );
}
