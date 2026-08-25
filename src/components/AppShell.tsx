import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/summarizer", label: "Meeting Summarizer" },
  { to: "/email", label: "Email Generator" },
  { to: "/planner", label: "Daily Planner" },
] as const;

export function AppShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      <div className="flex min-h-screen">
        <nav className="hidden w-64 shrink-0 flex-col gap-8 border-r border-border p-6 md:flex">
          <div className="flex items-center gap-2 px-2">
            <div className="size-5 shrink-0 rounded-sm bg-primary" />
            <span className="text-sm font-semibold tracking-tight">Kinetix Guest</span>
          </div>

          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-2 rounded-md py-2 pr-3 pl-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 data-[status=active]:bg-foreground/5 data-[status=active]:text-foreground"
              >
                <span className="size-4 shrink-0 rounded-[2px] bg-muted-foreground/20" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-auto border-t border-border pt-6">
            <div className="rounded-lg bg-primary/5 p-3 ring-1 ring-primary/10">
              <p className="mb-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
                Guest Session
              </p>
              <p className="text-xs leading-normal text-muted-foreground">
                Data is stored locally in your browser. No account required.
              </p>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl space-y-12 p-8 lg:p-12">
            <header className="space-y-2">
              <h1 className="text-3xl leading-tight font-medium tracking-tight text-balance">
                {title}
              </h1>
              <p className="max-w-[56ch] text-muted-foreground text-pretty">{intro}</p>
              <div className="flex gap-1 pt-4 md:hidden">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground data-[status=active]:bg-foreground/5 data-[status=active]:text-foreground"
                  >
                    {item.label.split(" ")[0]}
                  </Link>
                ))}
              </div>
            </header>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function Panel({
  label,
  action,
  children,
  className = "",
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </h2>
        {action}
      </div>
      <div className="rounded-xl bg-card p-6 ring-1 ring-black/5">{children}</div>
    </section>
  );
}
