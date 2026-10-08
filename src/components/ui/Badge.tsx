import type { ReactNode } from "react";
import { cx } from "../../lib/format";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "dark";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  success: "bg-teal-50 text-teal-600 ring-teal-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  dark: "bg-white/10 text-white ring-white/15",
};

export function Badge({ tone = "neutral", icon, children, className }: {
  tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

const dots: Record<Tone, string> = {
  neutral: "bg-ink-400", brand: "bg-brand-500", success: "bg-teal-500", warning: "bg-amber-500",
  danger: "bg-rose-600", dark: "bg-white",
};

export function StatusDot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2.5" aria-hidden="true">
      {pulse && <span className={cx("absolute inline-flex size-full animate-ping rounded-full opacity-60", dots[tone])} />}
      <span className={cx("relative inline-flex size-2.5 rounded-full", dots[tone])} />
    </span>
  );
}
