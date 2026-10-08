import type { GazeDirection } from "../types/api";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/** 83_456 ms -> "01:23" (or "1:02:03" past an hour) */
export function clock(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return "--:--";
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** 3_240 ms -> "3.2 s", 95_000 -> "1 min 35 s" */
export function duration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return s ? `${m} min ${s} s` : `${m} min`;
}

export const pct = (value: number | null | undefined, digits = 0) =>
  value == null ? "—" : `${(value * 100).toFixed(digits)}%`;

export const dateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export const dateOnly = (iso: string | null | undefined) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }) : "—";

export const GAZE_LABEL: Record<GazeDirection, string> = {
  FORWARD: "Looking Forward",
  LEFT: "Looking Left",
  RIGHT: "Looking Right",
  UP: "Looking Up",
  DOWN: "Looking Down",
  NO_FACE: "Face not visible",
};

export const GAZE_SHORT: Record<GazeDirection, string> = {
  FORWARD: "Forward", LEFT: "Left", RIGHT: "Right", UP: "Up", DOWN: "Down", NO_FACE: "Not visible",
};

/** Gaze direction colours. The four away directions are a validated categorical set (lightness,
 *  chroma, CVD separation and 3:1 contrast all pass on white). Forward is the neutral baseline and
 *  "face not visible" is an absence state drawn with a hatched neutral, not a hue. */
export const GAZE_COLOR: Record<GazeDirection, string> = {
  FORWARD: "#dde2ea",
  LEFT: "#5b82f0",
  RIGHT: "#14a394",
  UP: "#9b7bf0",
  DOWN: "#d4508a",
  NO_FACE: "#8d96ad",
};

export function similarity(value: number | null | undefined): string {
  return value == null ? "—" : value.toFixed(2);
}
