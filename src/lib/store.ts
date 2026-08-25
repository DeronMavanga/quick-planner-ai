import { useCallback, useEffect, useState } from "react";
import type { EmailResult, SummaryResult } from "./ai-schemas";

export type Task = {
  id: string;
  title: string;
  detail?: string;
  owner?: string;
  due?: string;
  priority: "high" | "medium" | "low";
  estimate?: string;
  done: boolean;
  createdAt: string;
};

const KEYS = {
  tasks: "arc.tasks",
  summary: "arc.summary",
  email: "arc.email",
} as const;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("arc-store", { detail: key }));
}

function useLocal<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    setValue(read<T>(key) ?? fallback);
    const sync = () => setValue(read<T>(key) ?? fallback);
    window.addEventListener("arc-store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("arc-store", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T) => {
      write(key, next);
      setValue(next);
    },
    [key],
  );

  return [value, update] as const;
}

export function useTasks() {
  const [tasks, setTasks] = useLocal<Task[]>(KEYS.tasks, []);

  const addTasks = useCallback(
    (incoming: Omit<Task, "id" | "done" | "createdAt">[]) => {
      const created = incoming.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        done: false,
        createdAt: new Date().toISOString(),
      }));
      setTasks([...(read<Task[]>(KEYS.tasks) ?? []), ...created]);
      return created.length;
    },
    [setTasks],
  );

  const toggle = useCallback(
    (id: string) =>
      setTasks((read<Task[]>(KEYS.tasks) ?? []).map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    [setTasks],
  );

  const remove = useCallback(
    (id: string) => setTasks((read<Task[]>(KEYS.tasks) ?? []).filter((t) => t.id !== id)),
    [setTasks],
  );

  const clearDone = useCallback(
    () => setTasks((read<Task[]>(KEYS.tasks) ?? []).filter((t) => !t.done)),
    [setTasks],
  );

  return { tasks, addTasks, toggle, remove, clearDone };
}

export function useLastSummary() {
  return useLocal<(SummaryResult & { notes: string; savedAt: string }) | null>(KEYS.summary, null);
}

export function useLastEmail() {
  return useLocal<(EmailResult & { tone: string; savedAt: string }) | null>(KEYS.email, null);
}

export function bucketOf(task: Task): "overdue" | "high" | "upcoming" {
  if (task.done) return "upcoming";
  if (task.due) {
    const today = new Date().toISOString().slice(0, 10);
    if (task.due < today) return "overdue";
  }
  return task.priority === "high" ? "high" : "upcoming";
}

export function formatDue(due?: string) {
  if (!due) return "No date";
  const d = new Date(`${due}T00:00:00`);
  if (Number.isNaN(d.getTime())) return due;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `Due ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
