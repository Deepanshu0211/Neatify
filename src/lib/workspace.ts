import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { CronExpressionParser } from "cron-parser";

export const desktop = isTauri();
export type Move = {
  source: string;
  destination: string;
  category: string;
  extension: string;
  bytes: number;
  modified: number;
  session_id: string;
};
export type Failure = { path: string; reason: string };
export type Outcome = {
  organized: number;
  failed: number;
  cancelled: boolean;
  errors: Failure[];
};
export type Session = {
  id: string;
  path: string;
  timestamp: string;
  kind: string;
  organized: number;
  failed: number;
  cancelled: boolean;
  errors: Failure[];
  categories: Record<string, number>;
  undone: boolean;
};
export type Stats = {
  sessions: number;
  organized: number;
  failed: number;
  duration_ms: number;
  undo_count: number;
  file_types: Record<string, number>;
  categories: Record<string, number>;
  events: Session[];
};
export const emptyStats: Stats = {
  sessions: 0,
  organized: 0,
  failed: 0,
  duration_ms: 0,
  undo_count: 0,
  file_types: {},
  categories: {},
  events: [],
};
export type Schedule = {
  id: string;
  name: string;
  folder: string;
  cron: string;
  method: string;
  enabled: boolean;
  nextRun: string;
  lastRun?: string;
  result?: string;
};
export const presets = [
  {
    name: "Every 15 minutes",
    detail: "A little tidy, often",
    cron: "0 */15 * * * *",
  },
  { name: "Every hour", detail: "On the hour", cron: "0 0 * * * *" },
  {
    name: "Daily at 9 AM",
    detail: "Start with a clean slate",
    cron: "0 0 9 * * *",
  },
  {
    name: "Daily at midnight",
    detail: "A fresh start tomorrow",
    cron: "0 0 0 * * *",
  },
  { name: "Weekly · Sunday", detail: "Sunday at 9 AM", cron: "0 0 9 * * 0" },
  { name: "Monthly · 1st", detail: "First day at 9 AM", cron: "0 0 9 1 * *" },
];
export function nextRun(cron: string, from = new Date()) {
  if (cron.trim().split(/\s+/).length !== 6)
    throw new Error("Use six fields: second minute hour day month weekday.");
  return CronExpressionParser.parse(cron, { currentDate: from })
    .next()
    .toDate()
    .toISOString();
}
export function loadSchedules(): Schedule[] {
  try {
    const value = JSON.parse(
      localStorage.getItem("neatify-schedules-v2") || "[]",
    );
    return Array.isArray(value)
      ? value
          .filter(
            (s) =>
              typeof s.id === "string" &&
              typeof s.folder === "string" &&
              typeof s.cron === "string",
          )
          .map((s) => ({ ...s, nextRun: nextRun(s.cron) }))
      : [];
  } catch {
    return [];
  }
}
export function setting(key: string, fallback: boolean) {
  return localStorage.getItem(key) === null
    ? fallback
    : localStorage.getItem(key) === "true";
}
export async function command<T>(
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!desktop)
    throw new Error(
      "Open the Neatify desktop app to access your files. This browser is a visual preview.",
    );
  return invoke<T>(name, args);
}
export async function pickFolder() {
  if (!desktop)
    throw new Error("Folder access is available in the Neatify desktop app.");
  return (await open({
    directory: true,
    multiple: false,
    title: "Choose a folder to tidy",
  })) as string | null;
}
export const folderName = (path: string) =>
  path.split(/[\\/]/).filter(Boolean).pop() || path;
export const friendlyDate = (date: string) =>
  new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
