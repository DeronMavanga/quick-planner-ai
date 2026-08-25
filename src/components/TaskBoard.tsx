import { bucketOf, formatDue, useTasks, type Task } from "@/lib/store";

const COLUMNS = [
  { key: "overdue" as const, title: "Overdue", tone: "text-destructive" },
  { key: "high" as const, title: "High priority", tone: "text-primary" },
  { key: "upcoming" as const, title: "Upcoming", tone: "text-muted-foreground" },
];

export function TaskBoard({ label, editable = false }: { label: string; editable?: boolean }) {
  const { tasks, toggle, remove, clearDone } = useTasks();
  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </h2>
        {editable && done.length > 0 && (
          <button
            onClick={clearDone}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Clear {done.length} completed
          </button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-black/5">
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {COLUMNS.map((col) => {
            const items = active.filter((t) => bucketOf(t) === col.key);
            return (
              <div key={col.key} className="space-y-4 p-6">
                <h3 className={`flex items-center gap-2 text-xs font-semibold ${col.tone}`}>
                  <span className="size-2 rounded-full bg-current" />
                  {col.title}
                  <span className="font-normal opacity-60">{items.length}</span>
                </h3>
                <div className="space-y-3">
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nothing here.</p>
                  )}
                  {items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      variant={col.key}
                      onToggle={() => toggle(t.id)}
                      onRemove={() => remove(t.id)}
                      editable={editable}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TaskCard({
  task,
  variant,
  onToggle,
  onRemove,
  editable,
}: {
  task: Task;
  variant: "overdue" | "high" | "upcoming";
  onToggle: () => void;
  onRemove: () => void;
  editable: boolean;
}) {
  const styles =
    variant === "overdue"
      ? "bg-destructive/5 ring-destructive/10"
      : variant === "high"
        ? "bg-primary/5 ring-primary/10"
        : "bg-foreground/[0.02] ring-border";

  return (
    <div className={`group rounded-lg p-3 ring-1 ${styles}`}>
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          aria-label="Complete task"
          className="mt-0.5 size-3.5 shrink-0 rounded-[3px] border border-foreground/30 transition-colors hover:bg-foreground/10"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-pretty">{task.title}</p>
          {task.detail && (
            <p className="mt-0.5 text-[11px] text-muted-foreground text-pretty">{task.detail}</p>
          )}
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {formatDue(task.due)}
              {task.owner ? ` • ${task.owner}` : ""}
              {task.estimate ? ` • ${task.estimate}` : ""}
            </span>
            {editable && (
              <button
                onClick={onRemove}
                className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
