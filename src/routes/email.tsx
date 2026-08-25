import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, Panel } from "@/components/AppShell";
import { generateEmail } from "@/lib/ai.functions";
import { TONES, type Tone } from "@/lib/ai-schemas";
import { useLastEmail } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Kinetix Guest" },
      {
        name: "description",
        content:
          "Turn a short instruction into a clear, tone-matched email with a suggested subject line and a shorter variant.",
      },
      { property: "og:title", content: "Email Generator — Kinetix Guest" },
      {
        property: "og:description",
        content: "Draft professional emails from short instructions. No account needed.",
      },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const [instructions, setInstructions] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [, setLastEmail] = useLastEmail();
  const fn = useServerFn(generateEmail);

  const mutation = useMutation({
    mutationFn: (input: { instructions: string; tone: Tone; recipient?: string }) =>
      fn({ data: input }),
    onSuccess: (data) => setLastEmail({ ...data, tone, savedAt: new Date().toISOString() }),
  });

  const result = mutation.data;

  return (
    <AppShell
      title="Email Generator"
      intro="Describe what you need to say. The draft keeps your intent, fixes the wording, and suggests a subject line."
    >
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Panel label="Instruction">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Recipient (optional)</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="The design team"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">What should it say?</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                placeholder="Tell the team the launch moves to April 1 because the API migration slipped two weeks."
                className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap capitalize ring-1 transition-colors ${
                    tone === t
                      ? "bg-foreground text-background ring-foreground"
                      : "bg-background text-foreground/60 ring-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">
                {mutation.isPending ? "Drafting…" : "Nothing is sent anywhere."}
              </span>
              <button
                disabled={instructions.trim().length < 3 || mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    instructions,
                    tone,
                    ...(recipient.trim() ? { recipient: recipient.trim() } : {}),
                  })
                }
                className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-primary disabled:opacity-40"
              >
                Generate draft
              </button>
            </div>
            {mutation.isError && (
              <p className="text-xs text-destructive">
                {(mutation.error as Error).message || "Generation failed. Try again."}
              </p>
            )}
          </div>
        </Panel>

        <Panel label="Draft">
          {!result ? (
            <p className="text-sm text-muted-foreground">
              Your generated subject line and body will appear here.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Subject
                </span>
                <p className="text-sm font-medium">{result.subject}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Body
                </span>
                <div className="max-w-[52ch] text-sm leading-relaxed whitespace-pre-wrap text-pretty">
                  {result.body}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Shorter version
                </span>
                <div className="max-w-[52ch] text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground text-pretty">
                  {result.shortVersion}
                </div>
              </div>
              {result.missingInfo.length > 0 && (
                <div className="rounded-md bg-primary/5 p-3 ring-1 ring-primary/10">
                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-primary uppercase">
                    Needs your input
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {result.missingInfo.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <button
                  onClick={() => navigator.clipboard.writeText(result.shortVersion)}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Copy shorter version
                </button>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`)
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
    </AppShell>
  );
}
